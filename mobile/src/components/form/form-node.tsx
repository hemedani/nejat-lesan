import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type {
  AnswerTree,
  AnswerValue,
  ContentNode,
  FieldNode,
  FormDefinition,
  Issue,
  OptionItem,
  RepeatableNode,
} from '@forms';
import { evalRule, isNodeRequired, isNodeVisible, resolveOptions } from '@forms';
import type { ReferenceOption } from '@/api/form-definition';
import { addNestedRow, removeNestedRow, setFieldAnswer, setNestedRowAnswer } from '@/domain/form-state';
import { isDateTimeFieldType } from '@/domain/form-datetime';
import { ChipsRow, ErrorText, FieldLabel, FormInput } from '@/components/form-fields';
import { CardShell } from '@/components/form-fields';
import { DateTimeField } from '@/components/form/date-time-field';
import { AppTheme } from '@/constants/theme';

type Row = Record<string, AnswerValue>;

/**
 * Render one definition node.
 *
 * Visibility, requiredness and option narrowing all come from the shared engine
 * with the current answers, so what the officer sees is computed by exactly the
 * same code the backend uses to accept their submission.
 */
export function FormNode({
  node,
  definition,
  answers,
  options,
  errors,
  warnings,
  onChange,
  onEditLocation,
  scope = [],
  path = [],
}: {
  node: ContentNode;
  definition: FormDefinition;
  answers: AnswerTree;
  options: Record<string, ReferenceOption[]>;
  errors: Issue[];
  warnings: Issue[];
  onChange: (next: AnswerTree) => void;
  /**
   * Opens the map screen for a `location` field.
   *
   * Omitted where there is nothing to capture into (e.g. a preview), in which
   * case the field is display-only.
   */
  onEditLocation?: () => void;
  /** Enclosing repeatable rows, for rules scoped to the current row. */
  scope?: AnswerValue[];
  /** Chain of repeatable keys and row indices addressing this node. */
  path?: Array<string | number>;
}) {
  // A hidden node renders nothing, exactly as it will in the submitted report.
  if (!isNodeVisible(node, answers, scope)) return null;

  if (node.kind === 'group') {
    return (
      <View style={styles.group}>
        {node.label ? <Text style={styles.groupLabel}>{node.label}</Text> : null}
        {node.children.map((child) => (
          <FormNode
            key={child.key}
            node={child}
            definition={definition}
            answers={answers}
            options={options}
            errors={[]}
            warnings={[]}
            onChange={onChange}
            onEditLocation={onEditLocation}
            scope={scope}
            path={path}
          />
        ))}
      </View>
    );
  }

  if (node.kind === 'repeatable') {
    return (
      <RepeatableList
        node={node}
        definition={definition}
        answers={answers}
        options={options}
        path={path}
        onEditLocation={onEditLocation}
        onChange={onChange}
      />
    );
  }

  return (
    <Field
      node={node}
      definition={definition}
      answers={answers}
      options={options}
      errors={errors}
      warnings={warnings}
      scope={scope}
      path={path}
      onEditLocation={onEditLocation}
      onChange={onChange}
    />
  );
}

// ---------------------------------------------------------------------------

function RepeatableList({
  node,
  definition,
  answers,
  options,
  path,
  onEditLocation,
  onChange,
}: {
  node: RepeatableNode;
  definition: FormDefinition;
  answers: AnswerTree;
  options: Record<string, ReferenceOption[]>;
  path: Array<string | number>;
  onEditLocation?: () => void;
  onChange: (next: AnswerTree) => void;
}) {
  const [openRow, setOpenRow] = useState<number | null>(null);
  const rows = Array.isArray(answers[node.key]) ? (answers[node.key] as Row[]) : [];

  const max = node.maxItems;
  const atMax = typeof max === 'number' && rows.length >= max;

  return (
    <View style={styles.repeatable}>
      <View style={styles.repeatableHead}>
        <Text style={styles.repeatableTitle}>{node.label}</Text>
        <Text style={styles.count}>
          {rows.length}
          {typeof max === 'number' ? ` / ${max}` : ''}
        </Text>
      </View>

      {node.description ? <Text style={styles.hint}>{node.description}</Text> : null}

      {rows.map((row, index) => {
        const expanded = openRow === index;
        return (
          <CardShell
            key={index}
            index={index}
            title={node.itemLabel ?? node.label}
            onRemove={rows.length > (node.minItems ?? 0)
              ? () => onChange(removeNestedRow(answers, [node.key, ...path], index))
              : undefined}
          >
            {expanded ? (
              <View style={styles.rows}>
                {node.children.map((child) => (
                  <FormNode
                    key={child.key}
                    node={child}
                    definition={definition}
                    answers={answers}
                    options={options}
                    errors={[]}
                    warnings={[]}
                    onChange={onChange}
                    onEditLocation={onEditLocation}
                    scope={[...scopeOf(path), row]}
                    path={[node.key, index, ...path]}
                  />
                ))}
                <Text
                  style={styles.link}
                  onPress={() => setOpenRow(null)}
                >
                  بستن
                </Text>
              </View>
            ) : (
              <Text
                style={styles.link}
                onPress={() => setOpenRow(index)}
              >
                تکمیل اطلاعات
              </Text>
            )}
          </CardShell>
        );
      })}

      <Text
        style={[styles.add, atMax && styles.addDisabled]}
        onPress={() => {
          if (atMax) return;
          const next = addNestedRow(answers, [node.key, ...path], {});
          onChange(next);
          setOpenRow((Array.isArray(next[node.key]) ? (next[node.key] as Row[]).length : 1) - 1);
        }}
      >
        {atMax ? `حداکثر ${max} مورد` : `+ افزودن ${node.itemLabel ?? node.label}`}
      </Text>
    </View>
  );
}

/** Enclosing row objects for a path, so row-scoped rules can read their row. */
const scopeOf = (path: Array<string | number>): AnswerValue[] => path.filter(
  (step): step is string => typeof step === 'string',
);

// ---------------------------------------------------------------------------

function Field({
  node,
  definition,
  answers,
  options,
  errors,
  warnings,
  scope,
  path,
  onEditLocation,
  onChange,
}: {
  node: FieldNode;
  definition: FormDefinition;
  answers: AnswerTree;
  options: Record<string, ReferenceOption[]>;
  errors: Issue[];
  warnings: Issue[];
  scope: AnswerValue[];
  path: Array<string | number>;
  onEditLocation?: () => void;
  onChange: (next: AnswerTree) => void;
}) {
  const required = isNodeRequired(node, answers, scope);
  const value = readValue(answers, scope, node.key);

  const write = (next: AnswerValue | undefined) => {
    // Inside a row the write is row-scoped; at the top level it is a normal
    // field, which also applies any declared cascade clears.
    if (scope.length > 0) {
      onChange(setNestedRowAnswer(answers, [...path], lastIndex(path), node.key, next));
      return;
    }
    onChange(setFieldAnswer(definition, answers, node.key, next));
  };

  const items = useOptionItems(node, answers, options, scope);

  if (node.type === 'computed') {
    return (
      <View>
        <FieldLabel text={node.label} />
        <Text style={styles.computed}>{describeComputed(node, answers, scope)}</Text>
      </View>
    );
  }

  const hasChoices = items.length > 0;
  const multi = node.type === 'multi_select';

  return (
    <View style={styles.field}>
      <FieldLabel text={node.label} />
      {node.description ? <Text style={styles.hint}>{node.description}</Text> : null}

      {hasChoices ? (
        <ChipsRow
          items={items.map((item) => ({
            key: item.value,
            label: item.label,
            selected: multi
              ? Array.isArray(value) && (value as string[]).includes(item.value)
              : value === item.value,
            onPress: () => {
              if (multi) {
                const current = Array.isArray(value) ? (value as string[]) : [];
                write(
                  current.includes(item.value)
                    ? current.filter((entry) => entry !== item.value)
                    : [...current, item.value],
                );
                return;
              }
              // Tapping the chosen option again clears it: "not answered" and
              // "answered empty" differ to the engine's presence rules.
              write(value === item.value ? undefined : item.value);
            },
          }))}
        />
      ) : node.type === 'textarea' ? (
        <FormInput
          value={String(value ?? '')}
          onChangeText={(text) => write(text)}
          multiline
          placeholder={node.placeholder}
          hasError={errors.length > 0}
        />
      ) : node.type === 'reference' ? (
        <ReferenceField
          node={node}
          items={items}
          value={value}
          onSelect={write}
          hint={node.placeholder}
        />
      ) : node.type === 'plate' ? (
        <PlateField node={node} value={value} scope={scope} answers={answers} onChange={write} />
      ) : node.type === 'location' ? (
        <CapturedLocationField onEdit={onEditLocation} value={value} />
      ) : isDateTimeFieldType(node.type) ? (
        // A temporal field has a wire format the engine does not police, so it
        // gets a picker rather than a text box: the format is then something the
        // app guarantees instead of something the officer has to remember.
        <DateTimeField hasError={errors.length > 0} onCommit={write} type={node.type} value={value} />
      ) : node.type === 'file' ? (
        // Captured by the dedicated media screens and stored on the draft; the
        // field itself records that capture happened.
        <Text style={styles.hint}>مستندات از بخش رسانه ثبت می‌شود.</Text>
      ) : (
        <FormInput
          value={String(value ?? '')}
          onChangeText={(text) => write(node.type === 'number' ? toLatin(text) : text)}
          keyboardType={node.type === 'number' ? 'number-pad' : 'default'}
          placeholder={node.placeholder}
          hasError={errors.length > 0}
        />
      )}

      {warnings.map((issue, index) => (
        <Text key={index} style={styles.warning}>
          ⚠ {issue.message}
        </Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------

/**
 * Options for a field right now.
 *
 * `resolveOptions` already applies any `optionsFilter`, so this is the narrowed
 * list — a field conditioned on another answer genuinely offers different
 * choices. A `reference` source resolves against the option map the backend
 * sent, cached for offline use.
 */
const useOptionItems = (
  node: FieldNode,
  answers: AnswerTree,
  options: Record<string, ReferenceOption[]>,
  scope: AnswerValue[],
): OptionItem[] => {
  return useMemo(() => {
    if (node.type === 'boolean' && !node.options) {
      return [
        { value: 'بله', label: 'بله' },
        { value: 'خیر', label: 'خیر' },
      ];
    }
    if (node.options?.kind === 'reference') {
      const all = options[node.options.model] ?? [];
      const allowed = node.options.allowedIds;
      const narrowed = allowed && allowed.length > 0
        ? all.filter((option) => allowed.includes(option._id))
        : all;
      // The narrowing filter still applies on top of the whitelist.
      return resolveOptions(
        {
          ...node,
          options: {
            kind: 'literal',
            items: narrowed.map((option) => ({
              value: option._id,
              label: option.name,
            })),
          },
        },
        answers,
        scope,
      );
    }
    return resolveOptions(node, answers, scope);
  }, [node, answers, options, scope]);
};

const ReferenceField = ({
  node,
  items,
  value,
  onSelect,
  hint,
}: {
  node: FieldNode;
  items: OptionItem[];
  value: AnswerValue | undefined;
  onSelect: (value: string) => void;
  hint?: string;
}) => {
  const [open, setOpen] = useState(false);
  const chosen = items.find((item) => item.value === value);

  if (items.length === 0) {
    return (
      <View>
        <Text style={styles.hint}>
          گزینه‌ای برای این فیلد در دسترس نیست{node.options?.kind === 'reference' ? ' (خارج از خط)' : ''}.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.selector} onPress={() => setOpen((current) => !current)}>
        {chosen?.label ?? 'انتخاب کنید'}
      </Text>
      {open && (
        <View style={styles.dropdown}>
          {items.map((item) => (
            <Text
              key={item.value}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
};

/**
 * Composite Iranian licence plate.
 *
 * The parts differ per plate type (a national plate has four, a motorbike plate
 * two), so the variant is selected by evaluating its `when` rule against the
 * sibling plate-type answer.
 */
const PlateField = ({
  node,
  value,
  scope,
  answers,
  onChange,
}: {
  node: FieldNode;
  value: AnswerValue | undefined;
  scope: AnswerValue[];
  answers: AnswerTree;
  onChange: (value: AnswerValue) => void;
}) => {
  const variants = node.plateVariants ?? [];
  // The variant's `when` rule targets the plate-type field, so it is evaluated
  // with the row's scope to read the sibling answer.
  const active = variants.find((variant) => evalRule(variant.when, answers, scope));

  if (!active) {
    return <Text style={styles.hint}>پلاک برای این نوع لازم نیست.</Text>;
  }

  const current = (value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, AnswerValue>)
    : {}) as Record<string, AnswerValue>;

  return (
    <View style={styles.plate}>
      {active.parts.map((part) => (
        <View key={part.key} style={styles.platePart}>
          <FieldLabel text={part.label} />
          {part.kind === 'select' && part.items ? (
            <ChipsRow
              items={part.items.map((item) => ({
                key: item.value,
                label: item.label,
                selected: current[part.key] === item.value,
                onPress: () => onChange({ ...current, [part.key]: item.value }),
              }))}
            />
          ) : (
            <FormInput
              value={String(current[part.key] ?? '')}
              onChangeText={(text) =>
                onChange({ ...current, [part.key]: part.kind === 'digits' ? toLatin(text) : text })
              }
              keyboardType={part.kind === 'digits' ? 'number-pad' : 'default'}
            />
          )}
        </View>
      ))}
    </View>
  );
};

// ---------------------------------------------------------------------------

/**
 * A `location` field.
 *
 * The point is captured on the map screen and lives on the draft, so this shows
 * what was captured rather than offering a text input. It used to render a bare
 * hint, which made a `must()` location look unsatisfiable and impossible to
 * check — the officer could see neither the value nor any way to set it.
 *
 * An unanswered field says so plainly instead of rendering nothing, and the
 * action is labelled to match what it will do.
 */
const CapturedLocationField = ({
  value,
  onEdit,
}: {
  value: AnswerValue | undefined;
  onEdit?: () => void;
}) => {
  const point = asPoint(value);

  return (
    <View style={styles.captured}>
      <Text style={point ? styles.capturedValue : styles.hint}>
        {point
          ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
          : 'موقعیتی برای این واقعه ثبت نشده است.'}
      </Text>
      {onEdit ? (
        <Text style={styles.link} onPress={onEdit}>
          {point ? 'تغییر موقعیت' : 'ثبت موقعیت'}
        </Text>
      ) : null}
    </View>
  );
};

/** Read a `{ latitude, longitude }` answer, tolerating anything else. */
const asPoint = (
  value: AnswerValue | undefined,
): { latitude: number; longitude: number } | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, AnswerValue>;
  const { latitude, longitude } = row;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  return { latitude, longitude };
};

// ---------------------------------------------------------------------------

const readValue = (
  answers: AnswerTree,
  scope: AnswerValue[],
  key: string,
): AnswerValue | undefined => {
  for (let index = scope.length - 1; index >= 0; index--) {
    const candidate = scope[index];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const row = candidate as Record<string, AnswerValue>;
      if (row[key] !== undefined) return row[key];
    }
  }
  return answers[key];
};

const lastIndex = (path: Array<string | number>): number => {
  for (let index = path.length - 1; index >= 0; index--) {
    const step = path[index];
    if (typeof step === 'number') return step;
  }
  return 0;
};

/** Persian digits to ASCII, so a numeric part compares correctly. */
const toLatin = (text: string): string =>
  text
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));

const describeComputed = (
  node: FieldNode,
  answers: AnswerTree,
  scope: AnswerValue[],
): string => {
  if (!node.valueFrom) return '—';
  return evalRule(node.valueFrom, answers, scope) ? 'بله' : 'خیر';
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  hint: { fontSize: 11, color: AppTheme.colors.textSecondary, textAlign: 'right' },
  warning: { fontSize: 11, color: AppTheme.status.warning.text, textAlign: 'right' },
  computed: {
    fontSize: 13,
    color: AppTheme.colors.textBody,
    backgroundColor: AppTheme.colors.background,
    padding: 10,
    borderRadius: 10,
  },
  group: { gap: 10, borderRightWidth: 2, borderRightColor: AppTheme.colors.border, paddingRight: 10 },
  groupLabel: { fontSize: 12, color: AppTheme.colors.textSecondary, textAlign: 'right' },
  repeatable: { gap: 8 },
  repeatableHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repeatableTitle: { fontSize: 14, fontWeight: '700', color: AppTheme.colors.textBody, textAlign: 'right' },
  count: { fontSize: 12, color: AppTheme.colors.textSecondary },
  rows: { gap: 10 },
  link: { fontSize: 13, color: AppTheme.colors.primary, textAlign: 'right' },
  add: { fontSize: 13, color: AppTheme.colors.primary, textAlign: 'center', paddingVertical: 8 },
  addDisabled: { color: AppTheme.colors.textSecondary },
  selector: {
    fontSize: 14,
    color: AppTheme.colors.textBody,
    backgroundColor: AppTheme.colors.background,
    padding: 10,
    borderRadius: 10,
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: { fontSize: 13, padding: 10, color: AppTheme.colors.textBody },
  plate: { gap: 8 },
  platePart: { gap: 4 },
  captured: {
    gap: 6,
    backgroundColor: AppTheme.colors.background,
    padding: 10,
    borderRadius: 10,
  },
  capturedValue: {
    fontSize: 14,
    color: AppTheme.colors.textBody,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
});