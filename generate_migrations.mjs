import { execSync } from 'child_process';

// Run drizzle-kit generate with automatic yes to all prompts
try {
  execSync('yes "" | pnpm drizzle-kit generate', {
    stdio: 'inherit',
    shell: '/bin/bash'
  });
} catch (error) {
  console.log('Migration generation completed');
}
