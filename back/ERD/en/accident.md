# Accident Model ERD

## Entity-Relationship Diagram (Text-based)

```
┌──────────────────────────────────────────────────────────────────┐
│                          ACCIDENT                                │
├──────────────────────────────────────────────────────────────────┤
│ PURE FIELDS                                                      │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ seri: number                            (serial number)    │   │
│ │ serial: number                    (unique accident serial) │   │
│ │ location: GeoJSON Point          (accident location point) │   │
│ │ date_of_accident: date           (date accident occurred)  │   │
│ │ dead_count: number               (number of deaths)        │   │
│ │ has_witness: boolean              (witness present?)       │   │
│ │ news_number: number               (news report number)     │   │
│ │ officer: string                   (reporting officer name) │   │
│ │ injured_count: number             (number of injured)      │   │
│ │ completion_date: date             (report completion date) │   │
│ │ createdAt: date                   (record creation date)   │   │
│ │ updatedAt: date                   (last update date)       │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ EMBEDDED DTOs (Arrays)                                           │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ vehicle_dtos[]  → Array of VehicleDTO (see below)          │   │
│ │ pedestrian_dtos[] → Array of PedestrianDTO (see below)     │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ RELATIONS                                                        │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ SINGLE:                                                     │   │
│ │   province ──────► Province        (accidents reverse)      │   │
│ │   city ──────────► City            (accidents reverse)      │   │
│ │   township ──────► Township        (accidents reverse)      │   │
│ │   road ──────────► Road            (accidents reverse)      │   │
│ │   traffic_zone ──► TrafficZone     (accidents reverse)      │   │
│ │   city_zone ─────► CityZone        (accidents reverse)      │   │
│ │   type ──────────► Type            (accidents reverse)      │   │
│ │   position ──────► Position        (accidents reverse)      │   │
│ │   ruling_type ───► RulingType      (accidents reverse)      │   │
│ │   light_status ─► LightStatus      (accidents reverse)      │   │
│ │   collision_type ► CollisionType   (accidents reverse)      │   │
│ │   road_situation ► RoadSituation   (accidents reverse)      │   │
│ │   road_repair_type ► RepairType    (accidents reverse)      │   │
│ │   shoulder_status ► ShoulderStatus (accidents reverse)      │   │
│ │ MULTIPLE:                                                   │   │
│ │   area_usages ───► AreaUsage[]     (accidents reverse)      │   │
│ │   air_statuses ──► AirStatus[]     (accidents reverse)      │   │
│ │   road_defects ──► RoadDefect[]    (accidents reverse)      │   │
│ │   human_reasons ► HumanReason[]    (accidents reverse)      │   │
│ │   vehicle_reasons ► VehicleReason[] (accidents reverse)     │   │
│ │   equipment_damages ► EquipmentDamage[] (accidents reverse) │   │
│ │   road_surface_conditions ► RoadSurfaceCondition[] (rev)    │   │
│ │   attachments ──► File[]          (no reverse relation)     │   │
│ └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## VehicleDTO (Embedded in vehicle_dtos[])

| Field | Type | Description |
|-------|------|-------------|
| color | common_relation_struct | Vehicle color {_id, name} |
| driver | object | Driver details (see below) |
| system | common_relation_struct | Vehicle system {_id, name} |
| plaque_type | common_relation_struct | License plate type {_id, name} |
| plaque_no | tuple(string, string, string) | License plate number |
| system_type | common_relation_struct | System type {_id, name} |
| fault_status | common_relation_struct | Fault status {_id, name} |
| insurance_co | common_relation_struct | Insurance company {_id, name} |
| insurance_no | string | Insurance policy number |
| plaque_usage | common_relation_struct | Plate usage type {_id, name} |
| print_number | string | Vehicle print number |
| plaque_serial | string[] (optional) | License plate serial numbers |
| insurance_date | date | Insurance expiration date |
| body_insurance_co | common_relation_struct | Body insurance company {_id, name} |
| body_insurance_no | string (optional) | Body insurance number |
| motion_direction | common_relation_struct | Direction of motion {_id, name} |
| body_insurance_date | date | Body insurance expiration date |
| max_damage_sections | common_relation_struct[] | Max damage sections array |
| damage_section_other | string | Other damage section description |
| insurance_warranty_limit | number | Insurance warranty limit amount |
| passenger_dtos | PassengerDTO[] (optional) | Vehicle passengers array |

### Driver (Inside VehicleDTO)

| Field | Type | Description |
|-------|------|-------------|
| sex | enum(Male, Female, Other) | Driver gender |
| last_name | string | Driver last name |
| first_name | string | Driver first name |
| injury_type | common_relation_struct | Injury type {_id, name} |
| licence_type | common_relation_struct | License type {_id, name} |
| national_code | string | National ID number |
| licence_number | string (optional) | Driver license number |
| total_reason | common_relation_struct (optional) | Total reason {_id, name} |

### PassengerDTO (Inside VehicleDTO)

| Field | Type | Description |
|-------|------|-------------|
| sex | enum(Male, Female, Other) | Passenger gender |
| last_name | string | Passenger last name |
| first_name | string | Passenger first name |
| injury_type | common_relation_struct | Injury type {_id, name} |
| fault_status | common_relation_struct | Fault status {_id, name} |
| total_reason | common_relation_struct (optional) | Total reason {_id, name} |
| national_code | string | National ID number |

## PedestrianDTO (Embedded in pedestrian_dtos[])

| Field | Type | Description |
|-------|------|-------------|
| sex | enum(Male, Female, Other) | Pedestrian gender |
| last_name | string | Pedestrian last name |
| first_name | string | Pedestrian first name |
| injury_type | common_relation_struct | Injury type {_id, name} |
| fault_status | common_relation_struct | Fault status {_id, name} |
| total_reason | common_relation_struct (optional) | Total reason {_id, name} |
| national_code | string | National ID number |

## Relations Detail

### Relations from Accident → Other Models

| Relation Name | Type | Schema | Optional | Excludes | Reverse Relation |
|--------------|------|--------|----------|----------|-----------------|
| province | single | province | true | area, center_location, createdAt, updatedAt | accidents (multiple, 20) |
| city | single | city | true | area, center_location, createdAt, updatedAt | accidents (multiple, 20) |
| township | single | township | true | area, center_location, createdAt, updatedAt | accidents (multiple, 20) |
| road | single | road | true | area, updatedAt, createdAt | accidents (multiple, 20) |
| traffic_zone | single | traffic_zone | true | [traffic_zone_excludes] | accidents (multiple, 20) |
| city_zone | single | city_zone | true | [city_zone_excludes] | accidents (multiple, 20) |
| type | single | type | true | createdAt, updatedAt | accidents (multiple, 20) |
| area_usages | multiple | area_usage | true | createdAt, updatedAt | accidents (multiple, 20) |
| position | single | position | true | createdAt, updatedAt | accidents (multiple, 20) |
| ruling_type | single | ruling_type | true | createdAt, updatedAt | accidents (multiple, 20) |
| air_statuses | multiple | air_status | true | createdAt, updatedAt | accidents (multiple, 20) |
| light_status | single | light_status | true | createdAt, updatedAt | accidents (multiple, 20) |
| road_defects | multiple | road_defect | true | createdAt, updatedAt | accidents (multiple, 20) |
| human_reasons | multiple | human_reason | true | createdAt, updatedAt | accidents (multiple, 20) |
| collision_type | single | collision_type | true | createdAt, updatedAt | accidents (multiple, 20) |
| road_situation | single | road_situation | true | createdAt, updatedAt | accidents (multiple, 20) |
| road_repair_type | single | road_repair_type | true | createdAt, updatedAt | accidents (multiple, 20) |
| shoulder_status | single | shoulder_status | true | createdAt, updatedAt | accidents (multiple, 20) |
| vehicle_reasons | multiple | vehicle_reason | true | createdAt, updatedAt | accidents (multiple, 20) |
| equipment_damages | multiple | equipment_damage | true | createdAt, updatedAt | accidents (multiple, 20) |
| road_surface_conditions | multiple | road_surface_condition | true | createdAt, updatedAt | accidents (multiple, 20) |
| attachments | multiple | file | true | createdAt, updatedAt | (none) |

## Indexes

| Index Field | Type | Description |
|------------|------|-------------|
| location | 2dsphere | Geospatial index for location-based queries |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "seri": 1403,
  "serial": 12345,
  "location": {
    "type": "Point",
    "coordinates": [51.3890, 35.6892]
  },
  "date_of_accident": "2024-06-15T14:30:00.000Z",
  "dead_count": 0,
  "has_witness": true,
  "news_number": 5678,
  "officer": "Officer Ahmad Mohammadi",
  "injured_count": 2,
  "completion_date": "2024-06-16T10:00:00.000Z",
  "vehicle_dtos": [
    {
      "color": { "_id": "color001", "name": "White" },
      "driver": {
        "sex": "Male",
        "last_name": "Ahmadi",
        "first_name": "Reza",
        "injury_type": { "_id": "inj001", "name": "Minor" },
        "licence_type": { "_id": "lic001", "name": "Grade 1" },
        "national_code": "1234567890",
        "licence_number": "12345",
        "total_reason": { "_id": "tr001", "name": "Speeding" }
      },
      "system": { "_id": "sys001", "name": "Brake" },
      "plaque_type": { "_id": "pt001", "name": "Private" },
      "plaque_no": ["12", "B", "345"],
      "system_type": { "_id": "st001", "name": "Hydraulic" },
      "fault_status": { "_id": "fs001", "name": "At Fault" },
      "insurance_co": { "_id": "ins001", "name": "Iran Insurance" },
      "insurance_no": "INS-12345-6789",
      "plaque_usage": { "_id": "pu001", "name": "Personal" },
      "print_number": "PRN-123456",
      "plaque_serial": ["ABC", "DEF"],
      "insurance_date": "2025-01-01T00:00:00.000Z",
      "body_insurance_co": { "_id": "bi001", "name": "Asia Insurance" },
      "body_insurance_no": "BODY-98765",
      "motion_direction": { "_id": "md001", "name": "Straight" },
      "body_insurance_date": "2025-01-01T00:00:00.000Z",
      "max_damage_sections": [
        { "_id": "mds001", "name": "Front Bumper" },
        { "_id": "mds002", "name": "Hood" }
      ],
      "damage_section_other": "",
      "insurance_warranty_limit": 500000000,
      "passenger_dtos": [
        {
          "sex": "Female",
          "last_name": "Ahmadi",
          "first_name": "Sara",
          "injury_type": { "_id": "inj001", "name": "Minor" },
          "fault_status": { "_id": "fs002", "name": "Not At Fault" },
          "total_reason": { "_id": "tr001", "name": "Speeding" },
          "national_code": "9876543210"
        }
      ]
    }
  ],
  "pedestrian_dtos": [
    {
      "sex": "Male",
      "last_name": "Karimi",
      "first_name": "Ali",
      "injury_type": { "_id": "inj002", "name": "Severe" },
      "fault_status": { "_id": "fs003", "name": "Pedestrian Fault" },
      "total_reason": { "_id": "tr003", "name": "Jaywalking" },
      "national_code": "1122334455"
    }
  ],
  "province": { "_id": "prov001", "name": "Tehran" },
  "city": { "_id": "city001", "name": "Tehran" },
  "township": { "_id": "twp001", "name": "District 6" },
  "road": { "_id": "road001", "name": "Valiasr Street" },
  "traffic_zone": { "_id": "tz001", "name": "Zone A" },
  "city_zone": { "_id": "cz001", "name": "District 6 Zone 1" },
  "type": { "_id": "type001", "name": "Car-Car Collision" },
  "area_usages": [
    { "_id": "au001", "name": "Residential" }
  ],
  "position": { "_id": "pos001", "name": "Intersection" },
  "ruling_type": { "_id": "rt001", "name": "Traffic Violation" },
  "air_statuses": [
    { "_id": "as001", "name": "Clear" }
  ],
  "light_status": { "_id": "ls001", "name": "Daylight" },
  "road_defects": [
    { "_id": "rd001", "name": "Pothole" }
  ],
  "human_reasons": [
    { "_id": "hr001", "name": "Distracted Driving" }
  ],
  "collision_type": { "_id": "ct001", "name": "Rear End" },
  "road_situation": { "_id": "rs001", "name": "Dry" },
  "road_repair_type": { "_id": "rrt001", "name": "Under Construction" },
  "shoulder_status": { "_id": "ss001", "name": "Shoulder Present" },
  "vehicle_reasons": [
    { "_id": "vr001", "name": "Brake Failure" }
  ],
  "equipment_damages": [
    { "_id": "ed001", "name": "Headlight Broken" }
  ],
  "road_surface_conditions": [
    { "_id": "rsc001", "name": "Asphalt" }
  ],
  "attachments": [
    { "_id": "file001", "name": "crash_photo_1.jpg", "type": "image/jpeg", "size": 2048576 }
  ],
  "createdAt": "2024-06-16T10:00:00.000Z",
  "updatedAt": "2024-06-16T10:00:00.000Z"
}
```

## Common Relation Struct

```typescript
{
  _id: ObjectId,
  name: string
}
```
