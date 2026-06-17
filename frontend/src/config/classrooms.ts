// Central Classrooms mapping with coordinates/geofence polygons

export interface ClassroomCoordinate {
  lat: number;
  lng: number;
}

export interface Classroom {
  id: string;
  name: string;
  polygon: ClassroomCoordinate[];
}

export const CLASSROOMS: Classroom[] = [
  {
    id: "608",
    name: "Class 608",
    polygon: [
      { lat: 22.600728, lng: 72.826142 },
      { lat: 22.600823, lng: 72.826125 },
      { lat: 22.60081, lng: 72.826045 },
      { lat: 22.60071, lng: 72.826065 }
    ]
  },
  {
    id: "609",
    name: "Class 609",
    polygon: [
      { lat: 22.600828, lng: 72.826142 },
      { lat: 22.600923, lng: 72.826125 },
      { lat: 22.60091, lng: 72.826045 },
      { lat: 22.60081, lng: 72.826065 }
    ]
  },
  {
    id: "610",
    name: "Class 610",
    polygon: [
      { lat: 22.600928, lng: 72.826142 },
      { lat: 22.601023, lng: 72.826125 },
      { lat: 22.60101, lng: 72.826045 },
      { lat: 22.60091, lng: 72.826065 }
    ]
  },
  {
    id: "611",
    name: "Class 611",
    polygon: [
      { lat: 22.600628, lng: 72.826142 },
      { lat: 22.600723, lng: 72.826125 },
      { lat: 22.60071, lng: 72.826045 },
      { lat: 22.60061, lng: 72.826065 }
    ]
  }
];
