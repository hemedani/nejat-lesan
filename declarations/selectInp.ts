
/* eslint-disable */

  
    export type userInp = {
      avatar?: number | fileInp
national_card?: number | fileInp
      uploadedAssets?: number | fileInp
police_station?: number | police_stationInp
    }


    export type userSchema = {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
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
police_station: {
_id?: string;
name: string;
location: {
};
area: {
};
code: number;
is_active: boolean;
military_rank: number;
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
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
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
axeses?: number | axesInp
    }


    export type provinceSchema = {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
registrer?: {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
cities: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
}[];
center: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
}[];
axeses: {
_id?: string;
name: string;
area: {
};
createdAt: Date;
updatedAt: Date;
}[];
};
;


    export type countryInp = {
      
      cities?: number | cityInp
capital?: number | cityInp
    }


    export type countrySchema = {
cities: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
}[];
capital: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
}[];
};
;


    export type cityInp = {
      registrer?: number | userInp
country?: number | countryInp
province?: number | provinceInp
      
    }


    export type citySchema = {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
registrer?: {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
country?: {
};
province?: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
};
};
;


    export type axesInp = {
      registrer?: number | userInp
province?: number | provinceInp
      
    }


    export type axesSchema = {
_id?: string;
name: string;
area: {
};
createdAt: Date;
updatedAt: Date;
registrer?: {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
province?: {
_id?: string;
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
};
};
;


    export type police_stationInp = {
      registrer?: number | userInp
commander?: number | userInp
      
    }


    export type police_stationSchema = {
_id?: string;
name: string;
location: {
};
area: {
};
code: number;
is_active: boolean;
military_rank: number;
createdAt: Date;
updatedAt: Date;
registrer?: {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
commander?: {
_id?: string;
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
};
;


    export type ReqType = {

  
        main: {

      
        user: {

      
            addUser: {
set: {
first_name: string;
last_name: string;
father_name: string;
mobile: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
national_number: string;
address: string;
level: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
is_verified: boolean;
createdAt: Date;
updatedAt: Date;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            getMe: {
set: {
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};
};

          
            getUser: {
set: {
_id: string;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
token?: (0 | 1 );
user: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};
};

          
            loginReq: {
set: {
national_number: string;
};
get: {
mobile: (1 );
national_number: (1 );
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
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            updateUser: {
set: {
first_name: string;
last_name: string;
father_name: string;
gender: ("Male" | "Female" );
birth_date?: Date;
summary?: string;
address: string;
createdAt: Date;
updatedAt: Date;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            registerUser: {
set: {
mobile: string;
national_number: string;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            changeMobile: {
set: {
national_number: string;
mobile: string;
};
get: {
mobile: (1 );
national_number: (1 );
};
};

          
            getUsers: {
set: {
levels?: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
page: number;
limit: number;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
success?: (0 | 1 );
};
};

          
            countUsers: {
set: {
levels?: ("Ghost" | "Manager" | "Editor" | "Ordinary" );
};
get: {
qty: (0 | 1 );
};
};

          
            toggleFavArticle: {
set: {
articleId: string;
};
get: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
          }

        
        file: {

      
            getFiles: {
set: {
page: number;
limit: number;
name?: string;
type?: ("image" | "video" | "doc" );
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};
};

          
            uploadFile: {
set: {
type: ("video" | "image" | "doc" );
createdAt: Date;
updatedAt: Date;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
uploader?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
          }

        
        city: {

      
            add: {
set: {
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
native_area: {
};
non_native_area: {
};
population: number;
area_number: number;
provinceId: string;
isCenter: boolean;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            update: {
set: {
_id: string;
name?: string;
english_name?: string;
area: {
};
center_location: {
};
native_area?: {
};
non_native_area?: {
};
population?: number;
area_number?: number;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            get: {
set: {
_id: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
country?: {
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
capital?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
country?: {
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
capital?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
success?: (0 | 1 );
};
};

          
            count: {
set: {
name?: string;
};
get: {
qty?: (0 | 1 );
};
};

          
          }

        
        province: {

      
            add: {
set: {
name: string;
english_name: string;
area: {
};
center_location: {
};
createdAt: Date;
updatedAt: Date;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            update: {
set: {
_id: string;
name?: string;
english_name?: string;
area: {
};
center_location: {
};
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            get: {
set: {
_id: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
country?: {
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
success?: (0 | 1 );
};
};

          
            count: {
set: {
name?: string;
};
get: {
qty?: (0 | 1 );
};
};

          
          }

        
        axes: {

      
            add: {
set: {
name: string;
area: {
};
createdAt: Date;
updatedAt: Date;
provinceId: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            update: {
set: {
_id: string;
name?: string;
area: {
};
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            get: {
set: {
_id: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
province?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
cities?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
center?: {
_id?: (0 | 1 );
name?: (0 | 1 );
english_name?: (0 | 1 );
area?: (0 | 1 );
center_location?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
native_area?: (0 | 1 );
non_native_area?: (0 | 1 );
population?: (0 | 1 );
area_number?: (0 | 1 );
};
axeses?: {
_id?: (0 | 1 );
name?: (0 | 1 );
area?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
success?: (0 | 1 );
};
};

          
            count: {
set: {
name?: string;
};
get: {
qty?: (0 | 1 );
};
};

          
          }

        
        police_station: {

      
            add: {
set: {
name: string;
location: {
};
area: {
};
code: number;
is_active: boolean;
military_rank: number;
createdAt: Date;
updatedAt: Date;
commanderId: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            update: {
set: {
_id: string;
name?: string;
area?: {
};
location?: {
};
code?: number;
is_active?: boolean;
military_rank?: number;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
};

          
            get: {
set: {
_id: string;
};
get: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
registrer?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
};
commander?: {
_id?: (0 | 1 );
first_name?: (0 | 1 );
last_name?: (0 | 1 );
father_name?: (0 | 1 );
mobile?: (0 | 1 );
gender?: (0 | 1 );
birth_date?: (0 | 1 );
summary?: (0 | 1 );
national_number?: (0 | 1 );
address?: (0 | 1 );
level?: (0 | 1 );
is_verified?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
avatar?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
national_card?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
uploadedAssets?: {
_id?: (0 | 1 );
name?: (0 | 1 );
type?: (0 | 1 );
size?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
};
police_station?: {
_id?: (0 | 1 );
name?: (0 | 1 );
location?: (0 | 1 );
area?: (0 | 1 );
code?: (0 | 1 );
is_active?: (0 | 1 );
military_rank?: (0 | 1 );
createdAt?: (0 | 1 );
updatedAt?: (0 | 1 );
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
success?: (0 | 1 );
};
};

          
            count: {
set: {
name?: string;
};
get: {
qty?: (0 | 1 );
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

  