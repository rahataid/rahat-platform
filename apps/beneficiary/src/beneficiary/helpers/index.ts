export const createListQuery = (dto: any) => {
  const AND_CONDITIONS = [];

  const queryKeys = Object.keys(dto);
  const queryValues = Object.values(dto);

  for (let i = 0; i < queryKeys.length; i++) {
    if (queryKeys[i] === 'projectId') {
      AND_CONDITIONS.push({
        projectId: queryValues[i],
      });
    }
    if (queryKeys[i] === 'gender') {
      AND_CONDITIONS.push({
        gender: queryValues[i],
      });
    }
    if (queryKeys[i] === 'type') {
      AND_CONDITIONS.push({
        type: queryValues[i],
      });
    }
  }

  return AND_CONDITIONS;
};
