# LESEN - Traffic Management System Context

## 🌟 Project Overview

LESEN is a comprehensive traffic management and accident reporting system built with a Deno-based backend API service. The project implements a microservices architecture to provide tools for managing traffic zones, road conditions, vehicles, and accident records.

### Architecture

- **Backend**: Custom Deno framework with MongoDB persistence and Redis caching
- **Database**: MongoDB for persistent data storage
- **Cache**: Redis for inline caching
- **Containerization**: Docker for service deployment

### Core Features

- RESTful API structure with proper error handling and validation
- Traffic zone management and mapping
- Comprehensive accident reporting and analysis
- Road condition monitoring
- Vehicle and user management
- Multi-level user authorization system

## 🛠️ Technologies & Stack

### Backend (Deno)

- **Framework**: Custom Deno framework based on LESEN v0.1.26 (pinned in `deps.ts`)
- **Language**: TypeScript
- **Database**: MongoDB with ODM integration
- **Cache**: Redis integration
- **Authentication**: JWT for token-based authentication
- **Dev Tools**: Deno's built-in development server with hot-reload capabilities

## 📁 Project Structure

```
back/
├───.dockerignore
├───.env.example
├───deno.json          # Deno configuration
├───deno.lock
├───deps.ts            # External dependencies
├───Dockerfile
├───mod.ts             # Main backend entry point
├───Models.md          # Data models documentation
├───models/            # Data models and schemas
│   ├───accident.ts
│   ├───city.ts
│   ├───road.ts
│   ├───user.ts
│   └───... (30+ model files)
├───src/               # Backend source code with setup functions
├───test/
├───uploads/           # File uploads directory
└───utils/             # Backend utilities
```

## 🚀 Building and Running

### Prerequisites

- Deno 1.28+
- Docker (for containerized deployment)
- MongoDB
- Redis (optional — only used by the `seed` act for caching; the app starts without it)

### Development Setup

```bash
# Start development server with hot reload
deno task bc-dev

# Or run with environment variables
ENV=development deno run -A --watch --watch-exclude=declarations --no-clear-screen ./mod.ts
```

### Environment Variables

The system uses the following environment variables:

| Variable        | Default                    | Description                       |
| --------------- | -------------------------- | --------------------------------- |
| SERVER_PORT     | 1404                       | Backend service port              |
| MONGO_URI       | mongodb://127.0.0.1:27017/ | MongoDB connection string         |
| REDIS_URI       | 127.0.0.1:6379             | Redis connection string           |
| TYPE_GENERATION | true                       | Enable TypeScript type generation |
| PLAYGROUND      | true                       | Enable API playground             |
| CORS_ORIGINS    | Multiple origins           | Allowed CORS origins list         |

## 🧪 Development Commands

### Backend (Deno)

- Run development server: `deno task bc-dev`
- The backend runs on port 1404 by default

## 🗄️ Data Models

The backend includes extensive data models for traffic management including:

- **Users & Drivers**: user.ts, driver.ts
- **Geographic**: province.ts, city.ts, township.ts, traffic_zone.ts, city_zone.ts
- **Accidents**: accident.ts with detailed accident reporting structure
- **Roads & Infrastructure**: road.ts, road_defect.ts, road_repair_type.ts
- **Vehicles**: vehicle.ts with various vehicle-related data
- **Incidents**: collision_types, fault_statuses, equipment_damages
- **Files**: file.ts for managing uploads
- **Insurance**: insurance_co.ts, body_insurance_co.ts
- **Environmental**: air_status.ts, light_status.ts, road_surface_condition.ts
- **Legal**: ruling_type.ts, fault_status.ts

The Accident model is particularly comprehensive, storing information about:

- Basic accident details (serial, date, location)
- Involved vehicles with detailed driver information
- Passenger information
- Pedestrian information
- Environmental conditions
- Road conditions
- Insurance information
- Attachment files

## 🐳 Docker Configuration

The project includes a multi-stage Dockerfile with both production and development stages:

### Production Stage

- Runs as non-root user for security
- Exposes port 1404
- Uses static configuration

### Development Stage

- Includes watch mode for hot reloading
- Exposes port 1404
- Runs as non-root user

## 🧱 System Architecture

The system is built on the LESEN framework with:

1. **ODM (Object Document Model)**: Handles MongoDB operations with schema definitions
2. **Action System**: Manages API endpoints and business logic
3. **Relation System**: Handles relationships between different data models
4. **Utility Functions**: Common functions for validation, token management, etc.

## 🛡️ Security Features

- JWT-based authentication (90-day expiry), issued by the single `login` act (email + password) used by both web and mobile
- Email + bcrypt-hashed password authentication; the old OTP/SMS flow (`loginReq`, `changeMobile`) and the personnel-code-keyed `mobileLogin` act were removed
- Sending an optional `device` payload with `login` creates a device-scoped patrol session: JWT carries `device_id`, requires `level === "Patrol"`, and revoked devices fail on their next request; per-user lockout (5 failed attempts → 5 min) applies to every login
- Passwords are never returned in any projection — `password` is excluded from the model and all responses (requesting it in `get` is rejected as type `never`)
- `setGhostPassword`: public, one-time Ghost bootstrap act — sets the Ghost's password to `password123` and (if unset) its email to `ghost@nejat.ai`
- `changeUserPassword`: Ghost-only act that resets any user's password by `userId` + `newPassword`
- Role-based access control with user levels (Ghost, Manager, Editor, Enterprise)
- Enterprise level includes additional settings field for limiting user access to provinces, cities, charts, and available filters
- Input validation using schema definitions
- `national_number` is optional but validated when provided (Iranian national ID)
- Proper file upload handling and storage

## 📊 Geographic Capabilities

The system includes robust geographic features:

- GeoJSON location storage for accidents
- 2dsphere index for geospatial queries
- Hierarchical geographic organization (Province → City → Township → Traffic Zone → City Zone)
- Road and infrastructure mapping

## 🚘 Vehicle and Driver Management

- Comprehensive vehicle information tracking
- Driver personal and license information
- Insurance details for vehicles
- Plaque (license plate) management with types and usage categories
- Passenger information tracking

## 🔧 Development Conventions

1. **Model Structure**: Each model follows a consistent pattern with:
   - `pure` schema definition with validation
   - `relations` for cross-model relationships
   - `excludes` for fields to hide in certain contexts

2. **Utility Functions**: Common utilities for:
   - Date/time handling
   - Text normalization (Persian text)
   - Validation (national number, etc.)
   - Token management
   - Error handling

3. **Type Safety**: Strong TypeScript typing throughout the codebase

4. **Denormalized Hierarchy Pattern**: Models that span multiple hierarchy levels can denormalize relation references for query efficiency. For example, a `Ware` model may store references to `wareType`, `wareClass`, `wareGroup`, and `wareModel` even though those can be traversed via relations. This enables:
   - Filtering by any level of the hierarchy without joins
   - Querying all items in a category efficiently
   - Consistent hierarchy traversal without deep relation penetration

5. **Delete redundant/dead models rather than maintaining them**: A model file that is never instantiated in `mod.ts` and never used by any act is dead code. Delete it. Examples removed from this repo: legacy `driver.ts`, `person.ts`, `country.ts`, `location_area.ts` (carried a broken `schemaName: "axes"` ref), `event_process.ts` — all superseded by embedded DTO arrays on `accident`.

## 📊 Analytics and Charts System

The most important section of this project is the analytics and charts system, located in `src/accident/charts/`. This comprehensive analytics system provides:

### Key Analytics Categories:

- **Temporal Analytics**: Time-based analysis including monthly, hourly, and seasonal trends
  - `temporalCountAnalytics`: Monthly accident counts over time
  - `temporalSeverityAnalytics`: Accident severity trends over time
  - `temporalCollisionAnalytics`: Collision type trends over time
  - `hourlyDayOfWeekAnalytics`: Time-of-day and day-of-week patterns
  - `temporalNightAnalytics`: Nighttime accident patterns
  - `temporalUnlicensedDriversAnalytics`: Unlicensed driver incident trends
  - `monthlyHolidayAnalytics`: Holiday-related accident patterns

- **Spatial Analytics**: Geographic and location-based analysis
  - `spatialSeverityAnalytics`: Geographic distribution of accident severity
  - `spatialCollisionAnalytics`: Geographic collision patterns
  - `spatialLightAnalytics`: Lighting condition impact by location
  - `spatialSingleVehicleAnalytics`: Single-vehicle accident locations
  - `spatialSafetyIndexAnalytics`: Safety index mapping by area
  - `areaUsageAnalytics`: Area usage patterns and accident correlations

- **Severity and Classification Analytics**:
  - `accidentSeverityAnalytics`: Breakdown of accidents by severity (Fatal, Injury, Damage)
  - `collisionAnalytics`: Analysis of different collision types
  - `totalReasonAnalytics`: Comprehensive reason analysis
  - `humanReasonAnalytics`: Human factor analysis
  - `vehicleReasonAnalytics`: Vehicle-related factor analysis

- **Specialized Analytics**:
  - `roadDefectsAnalytics`: Road defects and their impact on accidents
  - `eventCollisionAnalytics`: Collision analysis in specific events
  - `eventSeverityAnalytics`: Severity analysis in specific events
  - `companyPerformanceAnalytics`: Insurance company performance metrics
  - `temporalDamageAnalytics`: Damage type trends over time

### Technical Implementation:

Each analytics module follows a consistent pattern:

1. **mod.ts**: Sets up the act using `coreApp.acts.setAct` with appropriate permissions
2. **.fn.ts**: Contains the main analytics function implementing complex MongoDB aggregation
3. **.val.ts**: Provides comprehensive validation with all possible filter parameters

### Key Features of Analytics Modules:

- **Comprehensive Filtering**: All analytics endpoints support the same extensive set of filters for consistency:
  - Date ranges (from/to)
  - Geographic filters (province, city, road, traffic zones, etc.)
  - Vehicle-related filters (color, system, insurance, driver information)
  - Pedestrian-related filters
  - Environmental conditions (light, weather, road conditions)
  - Accident details (severity, collision type, etc.)

- **Multi-select Support**: All categorical filters support array inputs for multi-select functionality

- **Flexible Date Handling**: Most modules have default date ranges (e.g., last 3 Jalali years) but allow custom ranges

- **Advanced MongoDB Operations**: Uses sophisticated aggregation pipelines, $elemMatch for array fields, and proper indexing

- **Consistent Output Format**: Each analytics module returns data in a standardized format suitable for charting libraries

- **Security**: All analytics endpoints require "Manager" level access via `grantAccess`

- **Performance Optimization**: Uses efficient MongoDB operations like parallel countDocument calls for simple analytics

### Filter Consistency:

The analytics system ensures UI consistency through a shared filter schema that supports:

- Text search with partial matching
- Range filters for numeric values (Min/Max suffixes)
- Multi-select categorical filtering
- Embedded document filtering (for vehicle_dtos, pedestrian_dtos)
- Spatial filters (polygon-based, though reserved for future)

This analytics system provides the core functionality for the traffic management dashboard, enabling data-driven decisions for traffic safety improvements.

## 📁 File Management

- File uploads are stored in the "uploads" directory
- Files are linked to other models via relations
- The system handles various types of attachments for accident records

## 🌐 API Features

- Automatic type generation for frontend
- API playground for testing endpoints
- CORS support for multiple origins
- Static file serving for uploaded content
- Structured error responses

This system is designed for comprehensive traffic accident management with robust data models for accident reporting, traffic analysis, and geographic information systems. It provides a complete solution for traffic departments to track, analyze, and manage traffic incidents and related data.

## Lesan Framework Complete Documentation

### Core Concepts

Lesan is a web server and ODM (Object Document Model) framework designed to implement microservices with a focus on performance and data management. The core concepts include:

1. **Delegated Data Retrieval**: Inspired by GraphQL, Lesan delegates data retrieval management to the client without adding extra layers like GQL language processors.

2. **NoSQL Capabilities**: Leverages all capabilities of NoSQL databases to embed relationships within schemas without requiring server-side programmers to manage embeddings.

3. **Regular Structure for Validation**: Maintains a structured approach similar to SQL for data models in the ODM layer to ensure data validation.

4. **Advanced Relationship Management**: Provides a new definition for creating relationships between data, allowing full control over their details.

5. **Movable Data Structure**: Enables the data structure to move along with server-side functions for easier microservice management.

### Microservices Architecture

#### Traditional Challenges and Lesan Solution

**Challenges in Traditional Microservices:**

- Model consistency across services
- Data consistency when services fail to communicate
- Complex hardware resource distribution
- Difficult horizontal scaling

**Lesan's Solution:**

- Provides "small solutions for implementation of microservices that can reduce their implementation complexity"
- Proposes a new architecture that sits between microservices and monoliths
- Uses a unified database model with service-specific validation
- Eliminates data duplication and synchronization needs

**Unified Database Approach:**

- Create a comprehensive database with all possible models and fields
- Each service validates only the data relevant to it
- Services can share the same comprehensive model while working with only required fields
- Prevents data duplication and eliminates need for synchronization tools

### Function Structure

#### Main Components:

- **schemas**: Contains schema functions (getSchemas, getPureOfMainRelations, getSchema, etc.)
- **acts**: Action functions (setAct, getServiceKeys, getActs, etc.)
- **odm**: Object Document Model functions (setDb, getCollection, newModel, etc.)
- **contextFns**: Context management functions (getContextModel, setContext, addContext, etc.)

#### Key Functions:

- **setAct**: Used to register actions that define the API endpoints
- **newModel**: Creates a new data model with associated CRUD operations
- **addRelation** / **removeRelation**: Functions for managing relationships between data
- **find** / **findOne**: Functions for querying data with flexible projection
- **insertOne** / **insertMany**: Functions for creating new records
- **findOneAndUpdate**: Updates a single record based on criteria
- **deleteOne**: Deletes a single record
- **countDocument**: Counts documents matching specified criteria

### Validation Patterns

1. **Schema-based Validation**: Uses a structured schema approach with `set` and `get` objects:
   - `set`: Contains input parameters for the function
   - `get`: Defines the projection structure using `selectStruct`

2. **Type Safety**: Supports TypeScript with strong type definitions throughout the framework.

3. **Superstruct Validation**: Implements validation syntax using Superstruct for schema definitions.

4. **Relationship Validation**: Provides mechanisms to validate relationships between different data models.

5. **Depth Penetration Validation**: The `selectStruct` function dynamically generates validation schemas based on model and desired depth, with two parameters:
   - Model name for which to generate the validation object
   - Depth of penetration (number or object)

6. **Application-level Filters**: Validators should use application-level filtering parameters rather than exposing database-specific operators (e.g., avoid $gte, $lte, $regex in validators). Instead of accepting MongoDB operators directly from frontend, create application-specific parameters that are transformed into appropriate database queries internally. This approach provides better security and abstraction.

7. **Typed Relations**: When working with relationships, use `TInsertRelations<typeof model_relations>` to ensure type safety when defining relations in functions like `insertOne`. This provides compile-time validation of relation fields and helps prevent runtime errors.

8. **Relationship Replace Option**: The `replace` option in `addRelation` should be used with caution. When true, it deletes all existing relationships and replaces them with new ones, affecting all embedded relationships. For single-type relations, if `replace` is false and a relation already exists, an error occurs; if true, replacement occurs. For multiple-type relations, if `replace` is false, new documents are added to existing relations; if true, all existing relations are replaced. Always consider the implications before using `replace: true`.

9. **Sort Order Type Definition**: When defining relationship sorting, always include the `RelationSortOrderType` for the sort order field. For example: `order: "desc" as RelationSortOrderType`.

### Function Implementation Best Practices

1. **Model Access**: Always access models through the coreApp.odm namespace. For example, use `coreApp.odm.user` instead of importing user directly.

2. **Separation of Concerns**: In update functions (like updateUser), only update pure fields, and use separate update relation functions (like updateUserRelations) for managing relationships. This follows the principle of separating data field updates from relationship updates.

### Request Flow and HTTP Methods

#### Supported HTTP Methods:

- **GET**: Two models supported:
  - Static document requests (requires `staticPath` configuration in `runServer`)
  - Playground access requests (requires `playground: true` in `runServer`)
- **POST**: Two models supported:
  - Data retrieval requests with JSON body containing service, model, act, and details
  - Document upload requests following standard file upload protocols

#### POST Request Structure:

- **service**: Selects microservice (defaults to "main")
- **model**: Selects data model
- **act**: Selects action
- **details**: Contains data and selection criteria
  - `set`: Information needed in Act function
  - `get`: Selected information to return (MongoDB projection format)

### Relationship Management

#### Types of Relationships:

- **relation**: Defines relationships from the parent document to other documents
- **relatedRelations**: Defines the reverse relationships that get created on the target model

#### Relationship Types:

1. **Single Relations**: Defined with `type: "single"` as `RelationDataType`
2. **Multiple Relations**: Defined with `type: "multiple"` as `RelationDataType`
3. **Embedded Relations**: Store related data directly within parent document

#### Core Relationship Properties:

- **optional**: Whether the relationship is required or optional
- **schemaName**: The name of the schema this relationship connects to
- **type**: The relationship type ("single" or "multiple")
- **relatedRelations**: Defines the reverse relationships that get created on the target model
- **limit**: For multiple relations, limits the number of embedded documents
- **sort**: Defines sorting for embedded multiple relations
- **excludes**: Specifies which fields to exclude from the related data when projecting

#### Managing Relations:

- **addRelation Function**: Used instead of manual updates to add relationships between documents
- **removeRelation Function**: Used instead of manual updates to remove relationships between documents
- **Important**: Never manually update relationships with update or updateMany functions

#### addRelation Function Parameters:

- **filters**: MongoDB findOne filter to find the document to change
- **relations**: Object describing the relations to establish
- **projection**: Specifies which fields to return after relation is added
- **replace** (optional): When true, deletes existing relationships and replaces them with new ones (affects all embedded relationships). For single relationships, if replace is false and a relationship already exists, an error occurs; if true, the replacement occurs. For multiple relationships, if replace is false, new documents are added to existing relationships; if true, all existing relations are replaced. Use with caution as it affects all embedded relationships.

**Usage Pattern**: When designing your API, separate document property updates from relationship updates. Use findOneAndUpdate for document properties and addRelation/removeRelation specifically for managing relationships. This separation ensures data integrity and proper handling of relation cascades.

#### removeRelation Function Parameters:

- **filters**: MongoDB findOne filter to find the document to change
- **relations**: Object specifying which relationships to remove
- **projection**: Specifies which fields to return after relation is removed

### One-Directional Relations — Never Duplicate

Relations are strictly one-directional. When Model A defines a relation to Model B with `relatedRelations`, Lesan automatically creates and manages the reverse on Model B. **Never define the same relation on both models.**

**✅ Correct pattern — define relation on the "child" only:**
```typescript
// models/child.ts — THIS IS CORRECT
export const child_relations = {
  parent: {
    schemaName: "parent",
    type: "single",
    optional: false,
    relatedRelations: {
      // Lesan auto-creates parent.children from this
      children: {
        type: "multiple",
        limit: 50,
        sort: { field: "_id", order: "desc" },
      },
    },
  },
};
```

```typescript
// models/parent.ts — Just define its own relations
export const parent_relations = {
  // No "children" relation here — Lesan handles it automatically
};
```

**❌ Wrong pattern — never define reverse on the parent:**
```typescript
// models/parent.ts — DON'T DO THIS
export const parent_relations = {
  children: {  // ❌ This creates duplicates and errors
    schemaName: "child",
    type: "multiple",
    relatedRelations: { parent: ... },
  },
};
```

**Key rule:** The model that "belongs to" another model (has the foreign key) defines the relation. The parent model stays clean — Lesan embeds the reverse automatically.

**Concrete examples in this codebase:**
- `shift.ts` defines `officer`, `patrol_unit`, `vehicle` (single) with `relatedRelations: { shifts: ... }` → Lesan auto-creates `user.shifts`, `patrol_unit.shifts`, `vehicle.shifts`. `user`/`patrol_unit`/`vehicle` define **no** `shifts` relation.
- `patrol_unit.ts` defines `police_station` → Lesan auto-creates `police_station.patrol_units`.
- `patrol_unit.ts` defines `vehicles`/`officers` (multiple) → Lesan auto-creates the single reverse `vehicle.patrol_unit` / `user.patrol_unit`.
- `accident.ts` defines ~25 relations (`officer`, `patrol_unit`, `vehicle`, `road`, `city`, `province`, `police_station`, `collision_type`, …) → Lesan auto-creates the reverse `accidents` array on every target model.
- `file.ts` defines `accident` → Lesan auto-creates `accident.attachments`.
- `road.ts` defines `province` → Lesan auto-creates `province.roads`.

**What NOT to define on parent models (❌ Wrong — would duplicate/error):**
- `user` must not define `shifts`, `police_station` must not define `patrol_units`, `province` must not define `roads`/`cities`, `accident` targets must not define `accidents` — all of these are child relations and Lesan creates them automatically via `relatedRelations`.

### Lesan Relation Storage Model — Single Relations Are Embedded

Lesan **embeds** single-type relations directly in the parent document as an inline subdocument containing the full related object (all pure fields + `_id`). This means:

- **No performance penalty**: A `type: "single"` relation is just a nested object in the same document. Reading it requires zero additional queries or joins.
- **Fully indexable**: You can create MongoDB indexes on relation sub-fields like `relatedModel._id` or `relatedModel.name` just as you would on any top-level field.
- **No denormalization needed for performance**: Storing `relatedModelId` and `relatedModelName` as separate pure fields provides no query or speed advantage over a single Lesan relation — the data lives in the same document either way.

### Prefer Lesan Relations Over Raw `_id` Fields

Whenever you would store an ObjectId (or a name) in a **pure field** and later use it for a lookup, join, filter, or count, define a proper Lesan **single/multiple relation** instead:

- A relation is embedded in the same document (zero-join) and queryable via `"relationName._id"`, `"relationName.name"`, etc.
- Example fix applied in this repo: `file` previously stored a raw `accident_id` pure field **and** an `accident` relation; the duplicate pure field was removed and all count/filter queries moved to `"accident._id"`.
- Example fix applied in this repo: `announcement_read` stored a raw `announcement_id`; it was replaced by a proper `announcement` single relation (query on `"announcement._id"`).

Keep a raw pure-field id/name **only** for these three justified cases:

1. **Orphan resilience** — the referenced document may be deleted and the reference must survive.
2. **Immutable snapshots** — the value must not track source-of-truth updates (e.g. `announcement.target_user_ids`/`target_patrol_units` broadcast spec, `user.settings.cities`/`provinces` filtering denormalization, `accident.officer` legacy free-text name, `operation_log.entity_id`/`entity_type` polymorphic audit references).
3. **File ids inside embedded DTO arrays** — a Lesan relation cannot live inside an embedded sub-document array (e.g. `accident.vehicle_dtos[].plate_image`/`insurance_image`, `facility_damage_dtos[].images`). These are still joined via a top-level relation (`accident.attachments`).

### Prefer Embedding Over New Models

When a set of records is always read **through its parent**, is small, and is never queried independently, embed it as a **pure sub-schema array** in the parent (like `accident.vehicle_dtos`, `accident.review_history`, `road.lanes`) instead of creating a separate model + collection:

- Fewer collections, shorter code, no joins, and parent/child stay consistent in one document.
- This mirrors the pattern used in the LESEN sibling project (`ProcessStepAssigneeGroup` model → embedded `ProcessStep.assigneeGroups`).
- Example applied in this repo: the `accident_review` model was eliminated and embedded as `accident.review_history` (reviewer stored as an immutable `{_id, first_name, last_name}` snapshot).

**Scale caveat — keep a model when the child count per parent can be large.** As a rule of thumb, if a single parent can accrue more than ~10 child records (e.g. read receipts on an announcement broadcast to dozens–hundreds of officers), do **not** embed — keep a separate model and give it a proper relation (see `announcement_read`).

**Never define a Lesan relation *inside* an embedded array** — relations live at the document level only. Embedded arrays hold pure fields / sub-schemas.

### Complete Relation Maps (per-model)

What each model **defines** (own relations) and what Lesan **auto-creates** (reverse via `relatedRelations`). Reverses are never defined manually.

```
User
  ├── avatar (File) [single, opt]
  ├── national_card (File) [single, opt]
  └── (reverses: user.accidents, user.shifts, user.patrol_unit, user.devices,
         user.uploadedAssets, user.emergencies, user.announcement_reads)

Device
  └── owner (User) [single] → reverse: user.devices

File
  ├── uploader (User) [single] → reverse: user.uploadedAssets
  └── accident (Accident) [single, opt] → reverse: accident.attachments

Announcement
  ├── registrer (User) [single, opt]
  ├── attachments (File) [multiple, opt]
  └── (reverse: announcement.reads via announcement_read.announcement)

AnnouncementRead          ← kept as a model (audience per announcement can be large)
  ├── announcement (Announcement) [single] → reverse: announcement.reads
  └── reader (User) [single] → reverse: user.announcement_reads
        unique index on {"announcement._id", "reader._id"}

Emergency
  ├── officer (User) [single] → reverse: user.emergencies
  ├── patrol_unit (PatrolUnit) [single, opt] → reverse: patrol_unit.emergencies
  └── vehicle (Vehicle) [single, opt] → reverse: vehicle.emergencies

PatrolUnit
  ├── registrer (User) [single, opt]
  ├── police_station (PoliceStation) [single, opt] → reverse: police_station.patrol_units
  ├── vehicles (Vehicle) [multiple] → reverse: vehicle.patrol_unit (single)
  └── officers (User) [multiple] → reverse: user.patrol_unit (single)

Shift
  ├── registrer (User) [single, opt]
  ├── officer (User) [single] → reverse: user.shifts
  ├── patrol_unit (PatrolUnit) [single, opt] → reverse: patrol_unit.shifts
  └── vehicle (Vehicle) [single, opt] → reverse: vehicle.shifts

PoliceStation
  ├── registrer (User) [single, opt]
  ├── commander (User) [single, opt] → reverse: user.police_station
  └── (reverses: patrol_unit.patrol_units, accident.accidents)

Accident  (defines ~25 relations, each with reverse "accidents")
  ├── reviewer (User) [single, opt]
  ├── officer (User) [single, opt] → user.accidents
  ├── patrol_unit (PatrolUnit) / vehicle (Vehicle) → reverses: "accidents"
  ├── lane, position, police_station, croquis_type → reverses: "accidents"
  ├── province / city / township / road / traffic_zone / city_zone /
  │   air_pollution_zone / type / ruling_type / light_status /
  │   collision_type / road_situation / road_repair_type / shoulder_status →
  │   reverse: "accidents"
  ├── area_usages / air_statuses / road_defects / human_reasons /
  │   vehicle_reasons / equipment_damages / road_surface_conditions →
  │   reverse: "accidents"
  └── attachments (File) [multiple, opt]
  Embedded pure arrays: vehicle_dtos, pedestrian_dtos, people_dtos,
      facility_damage_dtos, review_history

Road
  ├── registrer (User) [single, opt]
  └── province (Province) [single, opt] → reverse: province.roads

City → registrer + province → reverse: province.cities
Township → registrer + province → reverse: province.townships
TrafficZone / CityZone / AirPollutionZone → registrer + city → reverse: city.*_zones

Shared reference models (type, position, color, plaque_type, …) → registrer (User) [single, opt]
OperationLog → actor (User) [single, opt]; entity_type/entity_id are intentional polymorphic raw refs
```

### Function Implementation Patterns

#### Add Function Pattern:

```typescript
const addEntityValidator = () => {
	return object({
		set: object({
			...pureFields,
			relationField: objectIdValidation, // for single relations
			// or relationField: array(objectIdValidation) for multiple
		}),
		get: coreApp.schemas.selectStruct("entity", 1),
	});
};

const addEntity: ActFn = async (body) => {
	const { relationField, ...otherFields } = body.details.set;

	return await model.insertOne({
		doc: { ...otherFields },
		projection: body.details.get,
		relations: {
			relationField: {
				_ids: [new ObjectId(relationField)], // Always use arrays
				relatedRelations: {
					reverseRelation: true, // or false depending on requirements
				},
			},
		},
	});
};
```

#### Get Function Pattern:

```typescript
const getEntityValidator = () => {
	return object({
		set: object({
			entityId: objectIdValidation, // Input parameters
		}),
		get: coreApp.schemas.selectStruct("entity", 1), // Projection structure
	});
};

const getEntity: ActFn = async (body) => {
	const {
		set: { entityId },
		get,
	} = body.details;

	return await model.findOne({
		filters: { _id: new ObjectId(entityId) }, // Match/filters parameter
		projection: get, // Get/projection parameter
	});
};
```

#### Gets Function Pattern:

```typescript
const getEntitiesValidator = () => {
	return object({
		set: object({
			page: number().optional().default(1), // Pagination parameters
			limit: number().optional().default(50),
			skip: number().optional(),
			// Additional filter parameters as needed
		}),
		get: coreApp.schemas.selectStruct("entity", 1), // Projection
	});
};

const getEntities: ActFn = async (body) => {
	let {
		set: { page, limit, skip },
		get,
	} = body.details;

	skip = skip || limit * (page - 1);

	return await model
		.find({
			filters: {}, // Match/filters parameter
			projection: get, // Get/projection parameter
		})
		.skip(skip) // Skip parameter
		.limit(limit) // Limit parameter
		.toArray();
};
```

#### Model Definition Pattern:

```typescript
export const model_pure = {
  name: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const model_relations = {
  relationName: {
    schemaName: "targetModel",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {
      reverseRelation: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const modelFactory = () =>
  coreApp.odm.newModel("modelName", model_pure, model_relations);
```

#### Action Pattern (3-file structure):

Each action follows a consistent 3-file layout in a subdirectory:
- `mod.ts` — Registers the action with Lesan using `setAct`
- `[action].fn.ts` — Function implementation
- `[action].val.ts` — Validator definition

```typescript
// add/mod.ts
export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "modelName",
    fn: addFn,
    actName: "add",
    preAct: [setTokens, setUser, grantAccess({ levels: ["Manager"] })],
    validator: addValidator(),
    validationRunType: "create",
  });

// add/add.val.ts
export const addValidator = () => object({
  set: object({ ...model_pure, relationId: objectIdValidation }),
  get: selectStruct("modelName", 1),
});

// add/add.fn.ts
export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { relationId, ...rest } = set;
  return await model.insertOne({
    doc: rest,
    projection: get,
    relations: { relationName: { _ids: [new ObjectId(relationId)] } },
  });
};
```

#### find and findOne Functions

**Parameters:**

- **filters**: MongoDB query operation to filter documents
- **projection**: MongoDB projection operation to specify which fields to return
- **options** (optional): MongoDB findOptions for additional configuration

**Key Features:**

- findOne retrieves a single document based on provided filters
- find retrieves multiple documents based on provided filters
- Both support relationship embedding through projection
- Both allow specifying depth of relationships to include
- find supports pagination when combined with .skip() and .limit() methods

#### Aggregation Functions

**Parameters:**

- **pipeline**: An array of MongoDB aggregation pipeline stages
- **projection**: Defines the fields to be returned in the response, including related data

**Usage:**

- Used when penetrating more than one step in relationship depths
- Relationship penetration is always one step behind the client request
- Can be used instead of find and findOne
- Automatically creates lookup, unwind and projection pipelines based on client's get input

### Update and Delete Operations

#### findOneAndUpdate Function

**Parameters:**

- **filter**: Defines which document to update (MongoDB filter)
- **projection**: Specifies which fields to return
- **update**: Defines how to update the document (MongoDB update operators)

**Important Note**: The findOneAndUpdate function should be used only for updating document properties, not relationships. For updating relationships, use addRelation and removeRelation functions.

**Complex Update Scenarios:**

- QQ (Query Queue): Queue of commands for chunking millions of updates
- In-Memory Database: Track changes to sent information in RAM
- Make New Relation: Convert frequently changing fields into new schemas with relationships

#### deleteOne Function

**Parameters:**

- **filter**: (Required) MongoDB filter object to specify which document to delete
- **hardCascade**: (Optional) Boolean value to enable recursive deletion of related documents
- **get**: (Optional) Object to specify which fields to return after deletion

**Features:**

- Automatically checks for related documents before deletion
- Prevents deletion with error message if related documents would become meaningless
- Supports hard cascade deletion for recursive deletion of dependent documents

**hardCascade Behavior:**

**Without `hardCascade` (default — safe):**
- Deleting a **child** removes it from the parent's embedded reverse array **automatically**. No manual cleanup needed.
- Deleting a **parent** is **blocked** if children still reference it via a reverse relation. Lesan returns an error telling you to handle children first.
- This ensures data integrity — you can always delete children safely, but you cannot accidentally orphan them.

**With `hardCascade: true` (dangerous):**
- Deleting a **parent** cascade-deletes all children that reference it via the reverse relation.
- Use only when you are certain you want to delete entire trees of data.
- Inadvisable for routine use — a wrong `hardCascade` can silently wipe large amounts of related data.

**Practical example — Province → City:**
| Action | `hardCascade` | Result |
|--------|---------------|--------|
| `city.deleteOne({ filter })` | not passed / false | ✅ City deleted. Province's embedded `cities` auto-cleaned. |
| `province.deleteOne({ filter })` | not passed / false | ❌ Blocked: error to clear cities first |
| `province.deleteOne({ filter, hardCascade: true })` | true | ✅ Province deleted. **All its cities cascade-deleted**. |

**Bottom line:** always delete **children first**, never rely on `hardCascade` for routine cleanup. `hardCascade: false` and omitting it are semantically identical (both = default safe mode); keep the `hardCascade: hardCascade || false` pattern rather than making it conditional.

**Recommended remove pattern:**
```typescript
return await model.deleteOne({
  filter: { _id: new ObjectId(_id as string) },
  hardCascade: hardCascade || false,
});
```

#### countDocument Function

**Parameters:**

- **filter**: (Required) MongoDB filter object to specify which documents to count

**Features:**

- Returns the number of documents that match the provided filter
- Efficiently counts documents without returning the actual documents

#### insertMany Function

**Parameters:**

- **docs**: An array of document objects to be inserted
- **projection**: Specifies which fields to return in the result
- **relations**: An object defining relationships to establish with other documents

**Features:**

- Validates all input data before execution
- Handles all types of relationships: one-to-many, many-to-many, and one-to-one
- All changes are sent to the database using an aggregation pipeline
- Significantly faster than other platforms for large data insertions

### Depth Penetration

The server-side programmer must determine the depth of relationships for each accessible endpoint before writing the accessible point. This prevents unbounded queries that could impact performance.

When using selectStruct with a number, it applies that depth to all relationships in the model. When using an object, you can specify different depths for different relationships.

### Queuing Data Changes (QQ System)

The QQ (Query Queue) system addresses the challenge of repeated data updates:

- Manages large numbers of updates by dividing them into smaller, processable parts
- Monitors server resources and sends small parts for updating based on available resources
- Reduces request count by comparing and merging similar requests
- Can verify consistency of repeated data and find/correct problems
- Supports AI integration for managing changes in the queue

### Playground Features

The interactive playground provides:

- Tabs for multiple simultaneous tasks
- Service, schema, and action selectors
- Set and get fields sections
- Response section with status indicators
- Settings for custom URLs and headers
- History of requests and responses
- E2E testing capabilities with sequence management
- Schema and act documentation
- Performance metrics

### Performance Conclusion

According to the documentation's benchmarks, Lesan significantly outperforms other frameworks:

- 1168% faster than Prisma-Express-REST (PostgreSQL)
- 1417% faster than Prisma-Express-GraphQL (PostgreSQL)
- 4435% faster than Mongoose-Express-REST (without sorting)
- 72289% faster than MongoDB-Express-REST (without sorting)
- 298971% faster than Mongoose-Express-REST (with sorting)

The trade-off is a minimal performance impact on create, update, and delete operations for significantly faster data retrieval, making it ideal for read-heavy applications.

### Philosophy

Lesan's core philosophy centers on simplifying the client-server communication process, maximizing NoSQL database capabilities, and enabling scalable microservice architectures. It focuses on performance by embedding relationships within documents, reducing the number of database queries needed for complex data retrieval operations. The framework addresses traditional challenges with GraphQL and SQL by providing database-optimized filtering and embedded relationships that maintain efficiency even with deep nested data access patterns.
