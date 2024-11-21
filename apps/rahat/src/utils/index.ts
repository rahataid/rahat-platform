export const splitCoordinates = (coordinateString: string) => {
    const [lat, lng, altitude, accuracy] = coordinateString.split(' ');

    return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        altitude: parseFloat(altitude),
        accuracy: parseFloat(accuracy)
    };
}