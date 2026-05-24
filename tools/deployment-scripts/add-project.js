const { PrismaClient } = require('@prisma/client');
const { prompt } = require('./_common');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function askProjectDetails() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'uuid',
      message: 'Enter project UUID:',
      validate: (input) => {
        if (!input || !input.trim()) {
          return 'UUID is required.';
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(input.trim())) {
          return 'Please enter a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000).';
        }
        return true;
      },
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter project name:',
      validate: (input) => {
        if (!input || !input.trim()) {
          return 'Project name is required.';
        }
        return true;
      },
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Enter project description (optional):',
      filter: (input) => input.trim() || null,
    },
    {
      type: 'input',
      name: 'type',
      message: 'Enter project type:',
      validate: (input) => {
        if (!input || !input.trim()) {
          return 'Project type is required.';
        }
        return true;
      },
      filter: (input) => input.trim(),
    },
  ]);

  return answers;
}

async function confirmProjectCreation(projectDetails) {
  console.log('\nProject details:');
  console.log(`  UUID: ${projectDetails.uuid}`);
  console.log(`  Name: ${projectDetails.name}`);
  console.log(`  Description: ${projectDetails.description || '(none)'}`);
  console.log(`  Type: ${projectDetails.type}`);

  const answers = await prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Create this project in the database?',
      default: true,
    },
  ]);

  return answers.confirmed;
}

async function createProject(projectDetails) {
  return prisma.project.create({
    data: {
      uuid: projectDetails.uuid,
      name: projectDetails.name,
      description: projectDetails.description,
      type: projectDetails.type,
      status: 'NOT_READY',
    },
  });
}

async function main() {
  const projectDetails = await askProjectDetails();
  const confirmed = await confirmProjectCreation(projectDetails);

  if (!confirmed) {
    console.log('Project creation cancelled.');
    return;
  }

  const project = await createProject(projectDetails);
  console.log(`\nSUCCESS: Project created with ID ${project.id}`);
  console.log(`  UUID: ${project.uuid}`);
  console.log(`  Name: ${project.name}`);
  console.log(`  Status: ${project.status}`);
}

main()
  .catch((error) => {
    console.error('Failed to create project.');
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
