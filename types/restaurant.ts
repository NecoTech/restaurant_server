import { File } from 'formidable';

export interface RestaurantFormFields {
    id: string;
    name: string;
    ownerEmail: string;
}

export interface RestaurantFormFiles {
    image: File;
}

export interface Restaurant {
    id: string;
    name: string;
    bannerImage: {
        data: Buffer;
        contentType: string;
    };
    ownerEmail: string;
}

export interface RestaurantDisplay {
    id: string;
    name: string;
    bannerImage: string; // base64 string
    ownerEmail: string;
}