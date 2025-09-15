export const pointToLatLng = (point: string): { lat: number; lng: number } => {
  const match = point.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) throw new Error('Invalid POINT format');
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
};

export const linestringToLatLngs = (
  linestring: string,
): { lat: number; lng: number }[] => {
  const match = linestring.match(/LINESTRING\((.+)\)/);
  if (!match) throw new Error('Invalid LINESTRING format');
  return match[1].split(', ').map((pair) => {
    const [lng, lat] = pair.split(' ').map(parseFloat);
    return { lat, lng };
  });
};

export const latLngToPoint = ({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}): string => {
  return `POINT(${lng} ${lat})`;
};

export const latLngsToLinestring = (
  points: { lat: number; lng: number }[],
): string => {
  const pointStr = points.map((p) => `${p.lng} ${p.lat}`).join(', ');
  return `LINESTRING(${pointStr})`;
};
