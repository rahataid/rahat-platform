export const splitCoordinates = (coordinateString: string) => {
    const [lat, lng, altitude, accuracy] = coordinateString.split(' ');

    return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        altitude: parseFloat(altitude),
        accuracy: parseFloat(accuracy)
    };
}

export const createExtrasAndPIIData = (beneficiary: any) => {
    if (beneficiary.coordinates) delete beneficiary.coordinates;
    const { name, phone, email, age, gender, latitude, longitude, meta, ...rest } = beneficiary;
    const extras = { ...rest, meta }
    const piiData = { name, phone, email };
    const payload = { age, gender, latitude, longitude, piiData, extras };
    return payload;
}