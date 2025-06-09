export const persinNum = [
  /۰/gi,
  /۱/gi,
  /۲/gi,
  /۳/gi,
  /۴/gi,
  /۵/gi,
  /۶/gi,
  /۷/gi,
  /۸/gi,
  /۹/gi,
];

export const numToEN = function (str: string) {
  for (let i = 0; i < 10; i++) {
    str = str.replace(persinNum[i], String(i));
  }
  return str;
};
