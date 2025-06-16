# Data Models

This document describes all the data models used in the traffic accident management system.

## Core Models

### File
Manages file uploads and attachments related to accident reports, including photos, documents, and other evidence.

### User
Handles user authentication and authorization, including police officers, administrators, and other system users.

### Accident
The main model representing traffic accident incidents, containing comprehensive accident details and linking to related data.

## Geographic Models

### City
Represents cities where accidents occur, providing location context for incidents.

### Province
Manages provincial/state information for geographic organization of accident data.

### City Zone
Defines specific zones within cities for more precise accident location tracking.

### Traffic Zone
Manages traffic control zones and areas with specific traffic regulations.

## Road and Infrastructure Models

### Road
Contains information about roads, streets, and highways where accidents occur.

### Road Defect
Tracks road defects and infrastructure issues that may contribute to accidents.

### Road Repair Type
Categorizes different types of road repairs and maintenance activities.

### Road Situation
Describes the general condition and situation of roads at accident locations.

### Road Surface Condition
Details the surface conditions of roads (wet, dry, icy, etc.) at the time of accidents.

### Position
Manages precise positioning data for accident locations.

## Vehicle-Related Models

### Color
Standardizes vehicle color classifications for accident reports.

### Plaque Type
Categorizes different types of license plates (regular, commercial, diplomatic, etc.).

### Plaque Usage
Defines how license plates are used (private, commercial, government, etc.).

### Licence Type
Manages different types of driving licenses and certifications.

### Type
General vehicle type classifications (car, truck, motorcycle, etc.).

## Environmental and Condition Models

### Air Status
Tracks air quality and atmospheric conditions at accident locations.

### Light Status
Records lighting conditions during accidents (daylight, night, dawn, dusk, etc.).

### Shoulder Status
Describes the condition of road shoulders at accident sites.

### Area Usage
Categorizes how the area around the accident is typically used (residential, commercial, industrial, etc.).

## Collision and Damage Models

### Collision Type
Classifies different types of vehicle collisions (head-on, rear-end, side-impact, etc.).

### Equipment Damage
Tracks damage to vehicle equipment and components.

### Max Damage Section
Identifies the section of vehicles with the most significant damage.

### Motion Direction
Records the direction of vehicle movement at the time of collision.

## Insurance and Legal Models

### Insurance Co
Manages insurance company information for processing claims.

### Body Insurance Co
Handles specialized body/physical injury insurance providers.

### Fault Status
Determines and tracks fault assignment in accident cases.

### Ruling Type
Categorizes legal rulings and decisions related to accidents.

## Reason and Cause Models

### Human Reason
Documents human factors contributing to accidents (driver error, fatigue, intoxication, etc.).

### Vehicle Reason
Tracks vehicle-related causes of accidents (mechanical failure, tire problems, etc.).

## System Models

### System
Core system configuration and settings.

### System Type
Categorizes different system types and configurations.

---

## Model Names List (for copy/paste)

```
File
User
Accident
City
Province
CityZone
TrafficZone
Road
RoadDefect
RoadRepairType
RoadSituation
RoadSurfaceCondition
Position
Color
PlaqueType
PlaqueUsage
LicenceType
Type
AirStatus
LightStatus
ShoulderStatus
AreaUsage
CollisionType
EquipmentDamage
MaxDamageSection
MotionDirection
InsuranceCo
BodyInsuranceCo
FaultStatus
RulingType
HumanReason
VehicleReason
System
SystemType
```
