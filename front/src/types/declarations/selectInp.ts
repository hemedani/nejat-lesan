
/* eslint-disable */


export type userInp = {
  avatar?: number | fileInp
  national_card?: number | fileInp
  uploadedAssets?: number | fileInp
}


export type userSchema = {
  _id?: string;
  first_name: string;
  last_name: string;
  father_name: string;
  mobile: string;
  gender: ("Male" | "Female");
  birth_date?: Date;
  summary?: string;
  national_number: string;
  address: string;
  level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar?: {
    _id?: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  };
  national_card?: {
    _id?: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  };
  uploadedAssets: {
    _id?: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};
;


export type fileInp = {
  uploader?: number | userInp

}


export type fileSchema = {
  _id?: string;
  name: string;
  type: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  uploader: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type provinceInp = {
  registrer?: number | userInp
  cities?: number | cityInp
  center?: number | cityInp
  accidents?: number | accidentInp
  axeses?: number | roadInp
}


export type provinceSchema = {
  _id?: string;
  name: string;
  english_name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: any[];
  };
  center_location: {
    type: "Point";
    coordinates: any[];
  };
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  cities: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  }[];
  center: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  }[];
  accidents: {
    _id?: string;
    seri: number;
    serial: number;
    location: {
      type: "Point";
      coordinates: any[];
    };
    date_of_accident: Date;
    dead_count: number;
    has_witness: boolean;
    news_number: number;
    officer: string;
    injured_count: number;
    completion_date: Date;
    vehicle_dtos: {
      color: {
        _id: string;
        name: string;
      };
      driver: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        licence_type: {
          _id: string;
          name: string;
        };
        national_code: string;
        licence_number?: string;
        total_reason?: {
          _id: string;
          name: string;
        };
      };
      system: {
        _id: string;
        name: string;
      };
      plaque_type: {
        _id: string;
        name: string;
      };
      plaque_no: any[];
      system_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      insurance_co: {
        _id: string;
        name: string;
      };
      insurance_no: string;
      plaque_usage: {
        _id: string;
        name: string;
      };
      print_number: string;
      plaque_serial?: string[];
      insurance_date: Date;
      body_insurance_co: {
        _id: string;
        name: string;
      };
      body_insurance_no?: string;
      motion_direction: {
        _id: string;
        name: string;
      };
      body_insurance_date: Date;
      max_damage_sections: {
        _id: string;
        name: string;
      }[];
      damage_section_other: string;
      insurance_warranty_limit: number;
      passenger_dtos?: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        fault_status: {
          _id: string;
          name: string;
        };
        total_reason?: {
          _id: string;
          name: string;
        };
        national_code: string;
      }[];
    }[];
    pedestrian_dtos?: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      total_reason?: {
        _id: string;
        name: string;
      };
      national_code: string;
    }[];
  }[];
  axeses: {
    _id?: string;
    name: string;
    area: {
      type: "MultiLineString";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  }[];
};
;


export type cityInp = {
  registrer?: number | userInp
  province?: number | provinceInp
  city_zones?: number | city_zoneInp
  accidents?: number | accidentInp
}


export type citySchema = {
  _id?: string;
  name: string;
  english_name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: any[];
  };
  center_location: {
    type: "Point";
    coordinates: any[];
  };
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  province?: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
  city_zones: {
    _id?: string;
    name: string;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    population: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  accidents: {
    _id?: string;
    seri: number;
    serial: number;
    location: {
      type: "Point";
      coordinates: any[];
    };
    date_of_accident: Date;
    dead_count: number;
    has_witness: boolean;
    news_number: number;
    officer: string;
    injured_count: number;
    completion_date: Date;
    vehicle_dtos: {
      color: {
        _id: string;
        name: string;
      };
      driver: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        licence_type: {
          _id: string;
          name: string;
        };
        national_code: string;
        licence_number?: string;
        total_reason?: {
          _id: string;
          name: string;
        };
      };
      system: {
        _id: string;
        name: string;
      };
      plaque_type: {
        _id: string;
        name: string;
      };
      plaque_no: any[];
      system_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      insurance_co: {
        _id: string;
        name: string;
      };
      insurance_no: string;
      plaque_usage: {
        _id: string;
        name: string;
      };
      print_number: string;
      plaque_serial?: string[];
      insurance_date: Date;
      body_insurance_co: {
        _id: string;
        name: string;
      };
      body_insurance_no?: string;
      motion_direction: {
        _id: string;
        name: string;
      };
      body_insurance_date: Date;
      max_damage_sections: {
        _id: string;
        name: string;
      }[];
      damage_section_other: string;
      insurance_warranty_limit: number;
      passenger_dtos?: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        fault_status: {
          _id: string;
          name: string;
        };
        total_reason?: {
          _id: string;
          name: string;
        };
        national_code: string;
      }[];
    }[];
    pedestrian_dtos?: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      total_reason?: {
        _id: string;
        name: string;
      };
      national_code: string;
    }[];
  }[];
};
;


export type traffic_zoneInp = {
  registrer?: number | userInp
  accidents?: number | accidentInp
}


export type traffic_zoneSchema = {
  _id?: string;
  name: string;
  area: {
    type: "MultiPolygon";
    coordinates: any[];
  };
  population: number;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  accidents: {
    _id?: string;
    seri: number;
    serial: number;
    location: {
      type: "Point";
      coordinates: any[];
    };
    date_of_accident: Date;
    dead_count: number;
    has_witness: boolean;
    news_number: number;
    officer: string;
    injured_count: number;
    completion_date: Date;
    vehicle_dtos: {
      color: {
        _id: string;
        name: string;
      };
      driver: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        licence_type: {
          _id: string;
          name: string;
        };
        national_code: string;
        licence_number?: string;
        total_reason?: {
          _id: string;
          name: string;
        };
      };
      system: {
        _id: string;
        name: string;
      };
      plaque_type: {
        _id: string;
        name: string;
      };
      plaque_no: any[];
      system_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      insurance_co: {
        _id: string;
        name: string;
      };
      insurance_no: string;
      plaque_usage: {
        _id: string;
        name: string;
      };
      print_number: string;
      plaque_serial?: string[];
      insurance_date: Date;
      body_insurance_co: {
        _id: string;
        name: string;
      };
      body_insurance_no?: string;
      motion_direction: {
        _id: string;
        name: string;
      };
      body_insurance_date: Date;
      max_damage_sections: {
        _id: string;
        name: string;
      }[];
      damage_section_other: string;
      insurance_warranty_limit: number;
      passenger_dtos?: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        fault_status: {
          _id: string;
          name: string;
        };
        total_reason?: {
          _id: string;
          name: string;
        };
        national_code: string;
      }[];
    }[];
    pedestrian_dtos?: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      total_reason?: {
        _id: string;
        name: string;
      };
      national_code: string;
    }[];
  }[];
};
;


export type city_zoneInp = {
  registrer?: number | userInp
  city?: number | cityInp
  accidents?: number | accidentInp
}


export type city_zoneSchema = {
  _id?: string;
  name: string;
  area: {
    type: "MultiPolygon";
    coordinates: any[];
  };
  population: number;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  city?: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
  accidents: {
    _id?: string;
    seri: number;
    serial: number;
    location: {
      type: "Point";
      coordinates: any[];
    };
    date_of_accident: Date;
    dead_count: number;
    has_witness: boolean;
    news_number: number;
    officer: string;
    injured_count: number;
    completion_date: Date;
    vehicle_dtos: {
      color: {
        _id: string;
        name: string;
      };
      driver: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        licence_type: {
          _id: string;
          name: string;
        };
        national_code: string;
        licence_number?: string;
        total_reason?: {
          _id: string;
          name: string;
        };
      };
      system: {
        _id: string;
        name: string;
      };
      plaque_type: {
        _id: string;
        name: string;
      };
      plaque_no: any[];
      system_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      insurance_co: {
        _id: string;
        name: string;
      };
      insurance_no: string;
      plaque_usage: {
        _id: string;
        name: string;
      };
      print_number: string;
      plaque_serial?: string[];
      insurance_date: Date;
      body_insurance_co: {
        _id: string;
        name: string;
      };
      body_insurance_no?: string;
      motion_direction: {
        _id: string;
        name: string;
      };
      body_insurance_date: Date;
      max_damage_sections: {
        _id: string;
        name: string;
      }[];
      damage_section_other: string;
      insurance_warranty_limit: number;
      passenger_dtos?: {
        sex: ("Male" | "Female" | "Other");
        last_name: string;
        first_name: string;
        injury_type: {
          _id: string;
          name: string;
        };
        fault_status: {
          _id: string;
          name: string;
        };
        total_reason?: {
          _id: string;
          name: string;
        };
        national_code: string;
      }[];
    }[];
    pedestrian_dtos?: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      total_reason?: {
        _id: string;
        name: string;
      };
      national_code: string;
    }[];
  }[];
};
;


export type roadInp = {
  registrer?: number | userInp
  province?: number | provinceInp

}


export type roadSchema = {
  _id?: string;
  name: string;
  area: {
    type: "MultiLineString";
    coordinates: any[];
  };
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  province?: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type typeInp = {
  registrer?: number | userInp

}


export type typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type area_usageInp = {
  registrer?: number | userInp

}


export type area_usageSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type positionInp = {
  registrer?: number | userInp

}


export type positionSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type ruling_typeInp = {
  registrer?: number | userInp

}


export type ruling_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type air_statusInp = {
  registrer?: number | userInp

}


export type air_statusSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type light_statusInp = {
  registrer?: number | userInp

}


export type light_statusSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type road_defectInp = {
  registrer?: number | userInp

}


export type road_defectSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type human_reasonInp = {
  registrer?: number | userInp

}


export type human_reasonSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type collision_typeInp = {
  registrer?: number | userInp

}


export type collision_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type road_situationInp = {
  registrer?: number | userInp

}


export type road_situationSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type road_repair_typeInp = {
  registrer?: number | userInp

}


export type road_repair_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type shoulder_statusInp = {
  registrer?: number | userInp

}


export type shoulder_statusSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type vehicle_reasonInp = {
  registrer?: number | userInp

}


export type vehicle_reasonSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type equipment_damageInp = {
  registrer?: number | userInp

}


export type equipment_damageSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type road_surface_conditionInp = {
  registrer?: number | userInp

}


export type road_surface_conditionSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type accidentInp = {
  province?: number | provinceInp
  city?: number | cityInp
  road?: number | roadInp
  traffic_zone?: number | traffic_zoneInp
  city_zone?: number | city_zoneInp
  type?: number | typeInp
  area_usages?: number | area_usageInp
  position?: number | positionInp
  ruling_type?: number | ruling_typeInp
  air_statuses?: number | air_statusInp
  light_status?: number | light_statusInp
  road_defects?: number | road_defectInp
  human_reasons?: number | human_reasonInp
  collision_type?: number | collision_typeInp
  road_situation?: number | road_situationInp
  road_repair_type?: number | road_repair_typeInp
  shoulder_status?: number | shoulder_statusInp
  vehicle_reasons?: number | vehicle_reasonInp
  equipment_damages?: number | equipment_damageInp
  road_surface_conditions?: number | road_surface_conditionInp
  attachments?: number | fileInp

}


export type accidentSchema = {
  _id?: string;
  seri: number;
  serial: number;
  location: {
    type: "Point";
    coordinates: any[];
  };
  date_of_accident: Date;
  dead_count: number;
  has_witness: boolean;
  news_number: number;
  officer: string;
  injured_count: number;
  completion_date: Date;
  vehicle_dtos: {
    color: {
      _id: string;
      name: string;
    };
    driver: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      licence_type: {
        _id: string;
        name: string;
      };
      national_code: string;
      licence_number?: string;
      total_reason?: {
        _id: string;
        name: string;
      };
    };
    system: {
      _id: string;
      name: string;
    };
    plaque_type: {
      _id: string;
      name: string;
    };
    plaque_no: any[];
    system_type: {
      _id: string;
      name: string;
    };
    fault_status: {
      _id: string;
      name: string;
    };
    insurance_co: {
      _id: string;
      name: string;
    };
    insurance_no: string;
    plaque_usage: {
      _id: string;
      name: string;
    };
    print_number: string;
    plaque_serial?: string[];
    insurance_date: Date;
    body_insurance_co: {
      _id: string;
      name: string;
    };
    body_insurance_no?: string;
    motion_direction: {
      _id: string;
      name: string;
    };
    body_insurance_date: Date;
    max_damage_sections: {
      _id: string;
      name: string;
    }[];
    damage_section_other: string;
    insurance_warranty_limit: number;
    passenger_dtos?: {
      sex: ("Male" | "Female" | "Other");
      last_name: string;
      first_name: string;
      injury_type: {
        _id: string;
        name: string;
      };
      fault_status: {
        _id: string;
        name: string;
      };
      total_reason?: {
        _id: string;
        name: string;
      };
      national_code: string;
    }[];
  }[];
  pedestrian_dtos?: {
    sex: ("Male" | "Female" | "Other");
    last_name: string;
    first_name: string;
    injury_type: {
      _id: string;
      name: string;
    };
    fault_status: {
      _id: string;
      name: string;
    };
    total_reason?: {
      _id: string;
      name: string;
    };
    national_code: string;
  }[];
  province?: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
  city?: {
    _id?: string;
    name: string;
    english_name: string;
    population: number;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    center_location: {
      type: "Point";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
  road?: {
    _id?: string;
    name: string;
    area: {
      type: "MultiLineString";
      coordinates: any[];
    };
    createdAt: Date;
    updatedAt: Date;
  };
  traffic_zone?: {
    _id?: string;
    name: string;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    population: number;
    createdAt: Date;
    updatedAt: Date;
  };
  city_zone?: {
    _id?: string;
    name: string;
    area: {
      type: "MultiPolygon";
      coordinates: any[];
    };
    population: number;
    createdAt: Date;
    updatedAt: Date;
  };
  type?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  area_usages?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  position?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  ruling_type?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  air_statuses?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  light_status?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  road_defects?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  human_reasons?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  collision_type?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  road_situation?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  road_repair_type?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  shoulder_status?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  };
  vehicle_reasons?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  equipment_damages?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  road_surface_conditions?: {
    _id?: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  attachments?: {
    _id?: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};
;


export type body_insurance_coInp = {
  registrer?: number | userInp

}


export type body_insurance_coSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type colorInp = {
  registrer?: number | userInp

}


export type colorSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type fault_statusInp = {
  registrer?: number | userInp

}


export type fault_statusSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type insurance_coInp = {
  registrer?: number | userInp

}


export type insurance_coSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type licence_typeInp = {
  registrer?: number | userInp

}


export type licence_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type max_damage_sectionInp = {
  registrer?: number | userInp

}


export type max_damage_sectionSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type motion_directionInp = {
  registrer?: number | userInp

}


export type motion_directionSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type plaque_typeInp = {
  registrer?: number | userInp

}


export type plaque_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type plaque_usageInp = {
  registrer?: number | userInp

}


export type plaque_usageSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type systemInp = {
  registrer?: number | userInp

}


export type systemSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type system_typeInp = {
  registrer?: number | userInp

}


export type system_typeSchema = {
  _id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  registrer?: {
    _id?: string;
    first_name: string;
    last_name: string;
    father_name: string;
    mobile: string;
    gender: ("Male" | "Female");
    birth_date?: Date;
    summary?: string;
    national_number: string;
    address: string;
    level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
;


export type ReqType = {


  main: {


    air_status: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    area_usage: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    body_insurance_co: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    city: {


      add: {
        set: {
          name: string;
          english_name: string;
          population: number;
          area: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          center_location: {
            type: "Point";
            coordinates: any[];
          };
          createdAt: Date;
          updatedAt: Date;
          provinceId: string;
          isCenter: boolean;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city_zones?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
          english_name?: string;
          population?: number;
          area?: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          center_location?: {
            type: "Point";
            coordinates: any[];
          };
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city_zones?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city_zones?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city_zones?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    city_zone: {


      add: {
        set: {
          name: string;
          area: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          population: number;
          createdAt: Date;
          updatedAt: Date;
          cityId: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
          population?: number;
          area?: {
            type: "MultiPolygon";
            coordinates: any[];
          };
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


      seedCityZones: {
        set: {
          cityId: string;
          geoId: string;
        };
        get: {
          summary: (1);
        };
      };


    }


    collision_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    color: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    equipment_damage: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    fault_status: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    file: {


      getFiles: {
        set: {
          page: number;
          limit: number;
          name?: string;
          type?: ("image" | "video" | "doc");
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          type?: (0 | 1);
          size?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          uploader?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      uploadFile: {
        set: {
          type: ("video" | "image" | "doc" | "geo" | "json");
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          type?: (0 | 1);
          size?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          uploader?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


    }


    human_reason: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    insurance_co: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    licence_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    light_status: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    max_damage_section: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    motion_direction: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    plaque_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    plaque_usage: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    position: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    province: {


      add: {
        set: {
          name: string;
          english_name: string;
          population: number;
          area: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          center_location: {
            type: "Point";
            coordinates: any[];
          };
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          cities?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          center?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
          axeses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
          english_name?: string;
          population?: number;
          area?: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          center_location?: {
            type: "Point";
            coordinates: any[];
          };
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          cities?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          center?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
          axeses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          cities?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          center?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          axeses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          english_name?: (0 | 1);
          population?: (0 | 1);
          area?: (0 | 1);
          center_location?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          cities?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          center?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          axeses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    road: {


      add: {
        set: {
          name: string;
          area: {
            type: "MultiLineString";
            coordinates: any[];
          };
          createdAt: Date;
          updatedAt: Date;
          provinceId: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
          area?: {
            type: "MultiLineString";
            coordinates: any[];
          };
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    road_defect: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    road_repair_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    road_situation: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    road_surface_condition: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    ruling_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    shoulder_status: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    system: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    system_type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    traffic_zone: {


      add: {
        set: {
          name: string;
          area: {
            type: "MultiPolygon";
            coordinates: any[];
          };
          population: number;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
          area?: {
            type: "MultiPolygon";
            coordinates: any[];
          };
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          area?: (0 | 1);
          population?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          accidents?: {
            _id?: (0 | 1);
            seri?: (0 | 1);
            serial?: (0 | 1);
            location?: (0 | 1);
            date_of_accident?: (0 | 1);
            dead_count?: (0 | 1);
            has_witness?: (0 | 1);
            news_number?: (0 | 1);
            officer?: (0 | 1);
            injured_count?: (0 | 1);
            completion_date?: (0 | 1);
            vehicle_dtos?: (0 | 1);
            pedestrian_dtos?: (0 | 1);
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            traffic_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zone?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            area_usages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            position?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            ruling_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            air_statuses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            light_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_defects?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            human_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            collision_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_situation?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_repair_type?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            shoulder_status?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            vehicle_reasons?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            equipment_damages?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            road_surface_conditions?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            attachments?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    type: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    user: {


      addUser: {
        set: {
          first_name: string;
          last_name: string;
          father_name: string;
          mobile: string;
          gender: ("Male" | "Female");
          birth_date?: Date;
          summary?: string;
          national_number: string;
          address: string;
          level: ("Ghost" | "Manager" | "Editor" | "Ordinary");
          is_verified: boolean;
          nationalCard?: string;
          avatar?: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      getMe: {
        set: {
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      getUser: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      login: {
        set: {
          national_number: string;
          code: string;
        };
        get?: {
          token?: (0 | 1);
          user: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      loginReq: {
        set: {
          national_number: string;
        };
        get: {
          mobile: (1);
          national_number: (1);
        };
      };


      tempUser: {
        set: {
          first_name: string;
          last_name: string;
          father_name: string;
          mobile: string;
          national_number: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      updateUser: {
        set: {
          _id: string;
          first_name?: string;
          last_name?: string;
          father_name?: string;
          gender?: ("Male" | "Female");
          birth_date?: Date;
          summary?: string;
          address?: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      registerUser: {
        set: {
          mobile: string;
          national_number: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      changeMobile: {
        set: {
          national_number: string;
          mobile: string;
        };
        get: {
          mobile: (1);
          national_number: (1);
        };
      };


      getUsers: {
        set: {
          levels?: ("Ghost" | "Manager" | "Editor" | "Ordinary");
          page: number;
          limit: number;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      removeUser: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      countUsers: {
        set: {
          levels?: ("Ghost" | "Manager" | "Editor" | "Ordinary");
        };
        get: {
          qty: (0 | 1);
        };
      };


      toggleFavArticle: {
        set: {
          articleId: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      updateUserRelations: {
        set: {
          _id: string;
          avatar?: string;
          nationalCard?: string;
        };
        get: {
          _id?: (0 | 1);
          first_name?: (0 | 1);
          last_name?: (0 | 1);
          father_name?: (0 | 1);
          mobile?: (0 | 1);
          gender?: (0 | 1);
          birth_date?: (0 | 1);
          summary?: (0 | 1);
          national_number?: (0 | 1);
          address?: (0 | 1);
          level?: (0 | 1);
          is_verified?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          avatar?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          national_card?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          uploadedAssets?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      dashboardStatistic: {
        set: {
        };
        get: {
          users?: (0 | 1);
          provinces?: (0 | 1);
          cities?: (0 | 1);
          accidents?: (0 | 1);
          airStatuses?: (0 | 1);
          areaUsages?: (0 | 1);
          bodyInsuranceCos?: (0 | 1);
          collisionTypes?: (0 | 1);
          colors?: (0 | 1);
          equipmentDamages?: (0 | 1);
          faultStatuses?: (0 | 1);
          humanReasons?: (0 | 1);
          insuranceCos?: (0 | 1);
          licenceTypes?: (0 | 1);
          lightStatuses?: (0 | 1);
          maxDamageSections?: (0 | 1);
          motionDirections?: (0 | 1);
          plaqueTypes?: (0 | 1);
          plaqueUsages?: (0 | 1);
          positions?: (0 | 1);
          roads?: (0 | 1);
          roadDefects?: (0 | 1);
          roadRepairTypes?: (0 | 1);
          roadSituations?: (0 | 1);
          roadSurfaceConditions?: (0 | 1);
          rulingTypes?: (0 | 1);
          shoulderStatuses?: (0 | 1);
          systems?: (0 | 1);
          systemTypes?: (0 | 1);
          types?: (0 | 1);
          vehicleReasons?: (0 | 1);
        };
      };


      seed: {
        set: {
          fileID: string;
        };
        get: {
          ok?: (0 | 1);
        };
      };


    }


    vehicle_reason: {


      add: {
        set: {
          name: string;
          createdAt: Date;
          updatedAt: Date;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          name?: string;
          names?: string[];
        };
        get: {
          _id?: (0 | 1);
          name?: (0 | 1);
          createdAt?: (0 | 1);
          updatedAt?: (0 | 1);
          registrer?: {
            _id?: (0 | 1);
            first_name?: (0 | 1);
            last_name?: (0 | 1);
            father_name?: (0 | 1);
            mobile?: (0 | 1);
            gender?: (0 | 1);
            birth_date?: (0 | 1);
            summary?: (0 | 1);
            national_number?: (0 | 1);
            address?: (0 | 1);
            level?: (0 | 1);
            is_verified?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            avatar?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            national_card?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            uploadedAssets?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              type?: (0 | 1);
              size?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          name?: string;
        };
        get: {
          qty?: (0 | 1);
        };
      };


    }


    accident: {


      add: {
        set: {
          seri?: number;
          serial?: number;
          location: {
            type: "Point";
            coordinates: any[];
          };
          date_of_accident: Date;
          dead_count?: number;
          has_witness?: boolean;
          news_number?: number;
          officer?: string;
          injured_count?: number;
          completion_date?: Date;
          vehicle_dtos?: {
            color?: {
              _id: string;
              name: string;
            };
            driver?: {
              sex?: ("Male" | "Female" | "Other");
              last_name?: string;
              first_name?: string;
              injury_type?: {
                _id: string;
                name: string;
              };
              licence_type?: {
                _id: string;
                name: string;
              };
              national_code?: string;
              licence_number?: string;
              total_reason?: {
                _id: string;
                name: string;
              };
            };
            system?: {
              _id: string;
              name: string;
            };
            plaque_type?: {
              _id: string;
              name: string;
            };
            plaque_no?: any[];
            system_type?: {
              _id: string;
              name: string;
            };
            fault_status?: {
              _id: string;
              name: string;
            };
            insurance_co?: {
              _id: string;
              name: string;
            };
            insurance_no?: string;
            plaque_usage?: {
              _id: string;
              name: string;
            };
            print_number?: string;
            plaque_serial?: string[];
            insurance_date?: Date;
            body_insurance_co?: {
              _id: string;
              name: string;
            };
            body_insurance_no?: string;
            motion_direction?: {
              _id: string;
              name: string;
            };
            body_insurance_date?: Date;
            max_damage_sections?: {
              _id: string;
              name: string;
            }[];
            damage_section_other?: string;
            insurance_warranty_limit?: number;
            passenger_dtos?: {
              sex?: ("Male" | "Female" | "Other");
              last_name?: string;
              first_name?: string;
              injury_type?: {
                _id: string;
                name: string;
              };
              fault_status?: {
                _id: string;
                name: string;
              };
              total_reason?: {
                _id: string;
                name: string;
              };
              national_code?: string;
            }[];
          }[];
          pedestrian_dtos?: {
            sex?: ("Male" | "Female" | "Other");
            last_name?: string;
            first_name?: string;
            injury_type?: {
              _id: string;
              name: string;
            };
            fault_status?: {
              _id: string;
              name: string;
            };
            total_reason?: {
              _id: string;
              name: string;
            };
            national_code?: string;
          }[];
          provinceId?: string;
          cityId?: string;
          roadId?: string;
          trafficZoneId?: string;
          cityZoneId?: string;
          typeId?: string;
          positionId?: string;
          rulingTypeId?: string;
          lightStatusId?: string;
          collisionTypeId?: string;
          roadSituationId?: string;
          roadRepairTypeId?: string;
          shoulderStatusId?: string;
          areaUsagesIds?: string[];
          airStatusesIds?: string[];
          roadDefectsIds?: string[];
          humanReasonsIds?: string[];
          vehicleReasonsIds?: string[];
          equipmentDamagesIds?: string[];
          roadSurfaceConditionsIds?: string[];
          attachmentsIds?: string[];
        };
        get: {
          _id?: (0 | 1);
          seri?: (0 | 1);
          serial?: (0 | 1);
          location?: (0 | 1);
          date_of_accident?: (0 | 1);
          dead_count?: (0 | 1);
          has_witness?: (0 | 1);
          news_number?: (0 | 1);
          officer?: (0 | 1);
          injured_count?: (0 | 1);
          completion_date?: (0 | 1);
          vehicle_dtos?: (0 | 1);
          pedestrian_dtos?: (0 | 1);
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          traffic_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          area_usages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          position?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          ruling_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          air_statuses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          light_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_defects?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          human_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          collision_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_situation?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_repair_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          shoulder_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          vehicle_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          equipment_damages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_surface_conditions?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          attachments?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      update: {
        set: {
          _id: string;
          name?: string;
        };
        get: {
          _id?: (0 | 1);
          seri?: (0 | 1);
          serial?: (0 | 1);
          location?: (0 | 1);
          date_of_accident?: (0 | 1);
          dead_count?: (0 | 1);
          has_witness?: (0 | 1);
          news_number?: (0 | 1);
          officer?: (0 | 1);
          injured_count?: (0 | 1);
          completion_date?: (0 | 1);
          vehicle_dtos?: (0 | 1);
          pedestrian_dtos?: (0 | 1);
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          traffic_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          city_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          area_usages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          position?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          ruling_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          air_statuses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          light_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_defects?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          human_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          collision_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_situation?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_repair_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          shoulder_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          vehicle_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          equipment_damages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          road_surface_conditions?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
          attachments?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
          };
        };
      };


      get: {
        set: {
          _id: string;
        };
        get: {
          _id?: (0 | 1);
          seri?: (0 | 1);
          serial?: (0 | 1);
          location?: (0 | 1);
          date_of_accident?: (0 | 1);
          dead_count?: (0 | 1);
          has_witness?: (0 | 1);
          news_number?: (0 | 1);
          officer?: (0 | 1);
          injured_count?: (0 | 1);
          completion_date?: (0 | 1);
          vehicle_dtos?: (0 | 1);
          pedestrian_dtos?: (0 | 1);
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          road?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          traffic_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          city_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          area_usages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          position?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          ruling_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          air_statuses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          light_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_defects?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          human_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          collision_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_situation?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_repair_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          shoulder_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          vehicle_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          equipment_damages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_surface_conditions?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          attachments?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      gets: {
        set: {
          page: number;
          limit: number;
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCount?: number;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCount?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          hasWitness?: string;
          newsNumber?: number;
          officer?: string;
          completionDateFrom?: string;
          completionDateTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          equipmentDamages?: string[];
          roadSurfaceConditions?: string[];
          attachmentName?: string;
          attachmentType?: string;
          vehicleColor?: string[];
          vehicleSystem?: string[];
          vehiclePlaqueType?: string[];
          vehicleSystemType?: string[];
          vehicleFaultStatus?: string[];
          vehicleInsuranceCo?: string[];
          vehicleInsuranceNo?: string;
          vehiclePlaqueUsage?: string[];
          vehiclePrintNumber?: string;
          vehiclePlaqueSerialElement?: string;
          vehicleInsuranceDateFrom?: string;
          vehicleInsuranceDateTo?: string;
          vehicleBodyInsuranceCo?: string[];
          vehicleBodyInsuranceNo?: string;
          vehicleMotionDirection?: string[];
          vehicleBodyInsuranceDateFrom?: string;
          vehicleBodyInsuranceDateTo?: string;
          vehicleMaxDamageSections?: string[];
          vehicleDamageSectionOther?: string;
          vehicleInsuranceWarrantyLimit?: number;
          vehicleInsuranceWarrantyLimitMin?: number;
          vehicleInsuranceWarrantyLimitMax?: number;
          driverSex?: string[];
          driverFirstName?: string;
          driverLastName?: string;
          driverNationalCode?: string;
          driverLicenceNumber?: string;
          driverLicenceType?: string[];
          driverInjuryType?: string[];
          driverTotalReason?: string[];
          passengerSex?: string[];
          passengerFirstName?: string;
          passengerLastName?: string;
          passengerNationalCode?: string;
          passengerInjuryType?: string[];
          passengerFaultStatus?: string[];
          passengerTotalReason?: string[];
          pedestrianSex?: string[];
          pedestrianFirstName?: string;
          pedestrianLastName?: string;
          pedestrianNationalCode?: string;
          pedestrianInjuryType?: string[];
          pedestrianFaultStatus?: string[];
          pedestrianTotalReason?: string[];
        };
        get: {
          _id?: (0 | 1);
          seri?: (0 | 1);
          serial?: (0 | 1);
          location?: (0 | 1);
          date_of_accident?: (0 | 1);
          dead_count?: (0 | 1);
          has_witness?: (0 | 1);
          news_number?: (0 | 1);
          officer?: (0 | 1);
          injured_count?: (0 | 1);
          completion_date?: (0 | 1);
          vehicle_dtos?: (0 | 1);
          pedestrian_dtos?: (0 | 1);
          province?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            cities?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            center?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
            axeses?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          city?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            english_name?: (0 | 1);
            population?: (0 | 1);
            area?: (0 | 1);
            center_location?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city_zones?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              area?: (0 | 1);
              population?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          road?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            province?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          traffic_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          city_zone?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            area?: (0 | 1);
            population?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            city?: {
              _id?: (0 | 1);
              name?: (0 | 1);
              english_name?: (0 | 1);
              population?: (0 | 1);
              area?: (0 | 1);
              center_location?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
            accidents?: {
              _id?: (0 | 1);
              seri?: (0 | 1);
              serial?: (0 | 1);
              location?: (0 | 1);
              date_of_accident?: (0 | 1);
              dead_count?: (0 | 1);
              has_witness?: (0 | 1);
              news_number?: (0 | 1);
              officer?: (0 | 1);
              injured_count?: (0 | 1);
              completion_date?: (0 | 1);
              vehicle_dtos?: (0 | 1);
              pedestrian_dtos?: (0 | 1);
            };
          };
          type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          area_usages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          position?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          ruling_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          air_statuses?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          light_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_defects?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          human_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          collision_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_situation?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_repair_type?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          shoulder_status?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          vehicle_reasons?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          equipment_damages?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          road_surface_conditions?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            registrer?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
          attachments?: {
            _id?: (0 | 1);
            name?: (0 | 1);
            type?: (0 | 1);
            size?: (0 | 1);
            createdAt?: (0 | 1);
            updatedAt?: (0 | 1);
            uploader?: {
              _id?: (0 | 1);
              first_name?: (0 | 1);
              last_name?: (0 | 1);
              father_name?: (0 | 1);
              mobile?: (0 | 1);
              gender?: (0 | 1);
              birth_date?: (0 | 1);
              summary?: (0 | 1);
              national_number?: (0 | 1);
              address?: (0 | 1);
              level?: (0 | 1);
              is_verified?: (0 | 1);
              createdAt?: (0 | 1);
              updatedAt?: (0 | 1);
            };
          };
        };
      };


      remove: {
        set: {
          _id: string;
          hardCascade?: boolean;
        };
        get: {
          success?: (0 | 1);
        };
      };


      count: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCount?: number;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCount?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          hasWitness?: string;
          newsNumber?: number;
          officer?: string;
          completionDateFrom?: string;
          completionDateTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          equipmentDamages?: string[];
          roadSurfaceConditions?: string[];
          attachmentName?: string;
          attachmentType?: string;
          vehicleColor?: string[];
          vehicleSystem?: string[];
          vehiclePlaqueType?: string[];
          vehicleSystemType?: string[];
          vehicleFaultStatus?: string[];
          vehicleInsuranceCo?: string[];
          vehicleInsuranceNo?: string;
          vehiclePlaqueUsage?: string[];
          vehiclePrintNumber?: string;
          vehiclePlaqueSerialElement?: string;
          vehicleInsuranceDateFrom?: string;
          vehicleInsuranceDateTo?: string;
          vehicleBodyInsuranceCo?: string[];
          vehicleBodyInsuranceNo?: string;
          vehicleMotionDirection?: string[];
          vehicleBodyInsuranceDateFrom?: string;
          vehicleBodyInsuranceDateTo?: string;
          vehicleMaxDamageSections?: string[];
          vehicleDamageSectionOther?: string;
          vehicleInsuranceWarrantyLimit?: number;
          vehicleInsuranceWarrantyLimitMin?: number;
          vehicleInsuranceWarrantyLimitMax?: number;
          driverSex?: string[];
          driverFirstName?: string;
          driverLastName?: string;
          driverNationalCode?: string;
          driverLicenceNumber?: string;
          driverLicenceType?: string[];
          driverInjuryType?: string[];
          driverTotalReason?: string[];
          passengerSex?: string[];
          passengerFirstName?: string;
          passengerLastName?: string;
          passengerNationalCode?: string;
          passengerInjuryType?: string[];
          passengerFaultStatus?: string[];
          passengerTotalReason?: string[];
          pedestrianSex?: string[];
          pedestrianFirstName?: string;
          pedestrianLastName?: string;
          pedestrianNationalCode?: string;
          pedestrianInjuryType?: string[];
          pedestrianFaultStatus?: string[];
          pedestrianTotalReason?: string[];
        };
        get: {
          total?: (0 | 1);
          filtered?: (0 | 1);
        };
      };


      roadDefectsAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCount?: number;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCount?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          hasWitness?: string;
          newsNumber?: number;
          officer?: string;
          completionDateFrom?: string;
          completionDateTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          equipmentDamages?: string[];
          roadSurfaceConditions?: string[];
          attachmentName?: string;
          attachmentType?: string;
          vehicleColor?: string[];
          vehicleSystem?: string[];
          vehiclePlaqueType?: string[];
          vehicleSystemType?: string[];
          vehicleFaultStatus?: string[];
          vehicleInsuranceCo?: string[];
          vehicleInsuranceNo?: string;
          vehiclePlaqueUsage?: string[];
          vehiclePrintNumber?: string;
          vehiclePlaqueSerialElement?: string;
          vehicleInsuranceDateFrom?: string;
          vehicleInsuranceDateTo?: string;
          vehicleBodyInsuranceCo?: string[];
          vehicleBodyInsuranceNo?: string;
          vehicleMotionDirection?: string[];
          vehicleBodyInsuranceDateFrom?: string;
          vehicleBodyInsuranceDateTo?: string;
          vehicleMaxDamageSections?: string[];
          vehicleDamageSectionOther?: string;
          vehicleInsuranceWarrantyLimit?: number;
          vehicleInsuranceWarrantyLimitMin?: number;
          vehicleInsuranceWarrantyLimitMax?: number;
          driverSex?: string[];
          driverFirstName?: string;
          driverLastName?: string;
          driverNationalCode?: string;
          driverLicenceNumber?: string;
          driverLicenceType?: string[];
          driverInjuryType?: string[];
          driverTotalReason?: string[];
          passengerSex?: string[];
          passengerFirstName?: string;
          passengerLastName?: string;
          passengerNationalCode?: string;
          passengerInjuryType?: string[];
          passengerFaultStatus?: string[];
          passengerTotalReason?: string[];
          pedestrianSex?: string[];
          pedestrianFirstName?: string;
          pedestrianLastName?: string;
          pedestrianNationalCode?: string;
          pedestrianInjuryType?: string[];
          pedestrianFaultStatus?: string[];
          pedestrianTotalReason?: string[];
        };
        get: {
          defectDistribution?: (0 | 1);
          defectCounts?: (0 | 1);
        };
      };


      roadDefectsAnalyticsWithCount: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string;
          city?: string;
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
        };
        get: {
          defectDistribution?: (0 | 1);
          defectCounts?: (0 | 1);
        };
      };


      monthlyHolidayAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCount?: number;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCount?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          hasWitness?: string;
          newsNumber?: number;
          officer?: string;
          completionDateFrom?: string;
          completionDateTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          equipmentDamages?: string[];
          roadSurfaceConditions?: string[];
          vehicleColor?: string[];
          vehicleSystem?: string[];
          vehiclePlaqueType?: string[];
          vehicleSystemType?: string[];
          vehicleFaultStatus?: string[];
          vehicleInsuranceCo?: string[];
          vehiclePlaqueUsage?: string[];
          vehicleBodyInsuranceCo?: string[];
          vehicleMotionDirection?: string[];
          vehicleMaxDamageSections?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
          driverTotalReason?: string[];
          driverFirstName?: string;
          driverLastName?: string;
          driverNationalCode?: string;
          driverLicenceNumber?: string;
        };
        get: {
          categories?: (0 | 1);
          series?: (0 | 1);
        };
      };


      hourlyDayOfWeekAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCount?: number;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCount?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          hasWitness?: string;
          newsNumber?: number;
          officer?: string;
          completionDateFrom?: string;
          completionDateTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          equipmentDamages?: string[];
          roadSurfaceConditions?: string[];
          vehicleColor?: string[];
          vehicleSystem?: string[];
        };
        get: {
          series?: (0 | 1);
        };
      };


      collisionAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          position?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          mainChart?: (0 | 1);
          singleVehicleChart?: (0 | 1);
          otherTypesChart?: (0 | 1);
        };
      };


      accidentSeverityAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      totalReasonAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      humanReasonAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      vehicleReasonAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      areaUsageAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      companyPerformanceAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalCountAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalSeverityAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadSurfaceConditions?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalNightAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          position?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          areaUsages?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalCollisionAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalDamageAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          position?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          vehicleSystem?: string[];
          maxDamageSections?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalTotalReasonAnalytics: {
        set: {
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          position?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          areaUsages?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      temporalUnlicensedDriversAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      spatialSeverityAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      spatialLightAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      spatialCollisionAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      spatialSingleVehicleAnalytics: {
        set: {
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      eventSeverityAnalytics: {
        set: {
          eventDateFrom?: string;
          eventDateTo?: string;
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      eventCollisionAnalytics: {
        set: {
          eventDateFrom?: string;
          eventDateTo?: string;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          accidentType?: string[];
          position?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          humanReasons?: string[];
          roadDefects?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      spatialSafetyIndexAnalytics: {
        set: {
          groupBy: ("province" | "city" | "city_zone");
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          vehicleSystem?: string[];
          driverSex?: string[];
        };
        get: {
          analytics: (1);
        };
      };


      mapAccidents: {
        set: {
          polygon?: {
            type: "Polygon";
            coordinates: any[];
          };
          limit?: number;
          skip?: number;
          seri?: number;
          serial?: number;
          dateOfAccidentFrom?: string;
          dateOfAccidentTo?: string;
          deadCountMin?: number;
          deadCountMax?: number;
          injuredCountMin?: number;
          injuredCountMax?: number;
          officer?: string;
          province?: string[];
          city?: string[];
          road?: string[];
          trafficZone?: string[];
          cityZone?: string[];
          accidentType?: string[];
          position?: string[];
          rulingType?: string[];
          lightStatus?: string[];
          collisionType?: string[];
          roadSituation?: string[];
          roadRepairType?: string[];
          shoulderStatus?: string[];
          areaUsages?: string[];
          airStatuses?: string[];
          roadDefects?: string[];
          humanReasons?: string[];
          vehicleReasons?: string[];
          roadSurfaceConditions?: string[];
          vehicleSystem?: string[];
          vehicleFaultStatus?: string[];
          driverSex?: string[];
          driverLicenceType?: string[];
          driverInjuryType?: string[];
        };
        get: {
          accidents: (1);
          total: (1);
        };
      };


    }


  }


};


export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const lesanApi = (
  { URL, settings, baseHeaders }: {
    URL: string;
    settings?: Record<string, any>;
    baseHeaders?: Record<string, any>;
  },
) => {
  const setting = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    ...settings,
  };

  const setHeaders = (headers: Record<string, any>) => {
    setting.headers = {
      ...setting.headers,
      ...headers,
    };
  };

  const getSetting = () => setting;

  const send = async <
    TService extends keyof ReqType,
    TModel extends keyof ReqType[TService],
    TAct extends keyof ReqType[TService][TModel],
    // @ts-ignore: Unreachable code error
    TSet extends DeepPartial<ReqType[TService][TModel][TAct]["set"]>,
    // @ts-ignore: Unreachable code error
    TGet extends DeepPartial<ReqType[TService][TModel][TAct]["get"]>,
  >(body: {
    service?: TService;
    model: TModel;
    act: TAct;
    details: {
      set: TSet;
      get: TGet;
    };
  }, additionalHeaders?: Record<string, any>) => {
    const req = await fetch(URL, {
      ...getSetting(),
      headers: {
        ...getSetting().headers,
        ...additionalHeaders,
        connection: "keep-alive",
      },
      body: JSON.stringify(body),
    });

    return await req.json();
  };

  return { send, setHeaders };
};


