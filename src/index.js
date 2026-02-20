import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import { makeRequest } from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API token not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  vercel config set --token YOUR_TOKEN'));
    console.log('\nGet a token at: https://vercel.com/account/tokens');
    process.exit(1);
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleString();
}

function truncate(str, maxLen = 40) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('vercel')
  .description(chalk.bold('Vercel CLI') + ' - Manage your Vercel deployments from the terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--token <token>', 'Vercel API token')
  .option('--team <teamId>', 'Default team ID')
  .action((options) => {
    if (options.token) {
      setConfig('apiKey', options.token);
      printSuccess('API token set');
    }
    if (options.team) {
      setConfig('teamId', options.team);
      printSuccess('Team ID set');
    }
    if (!options.token && !options.team) {
      printError('No options provided. Use --token or --team');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    const teamId = getConfig('teamId');
    console.log(chalk.bold('\nVercel CLI Configuration\n'));
    console.log('API Token: ', apiKey ? chalk.green(apiKey.substring(0, 10) + '...' + apiKey.slice(-6)) : chalk.red('not set'));
    console.log('Team ID:   ', teamId ? chalk.cyan(teamId) : chalk.dim('not set (using personal account)'));
    console.log('');
  });

// ============================================================
// DEPLOYMENTS
// ============================================================

const deploymentsCmd = program.command('deployments').description('Manage deployments');

deploymentsCmd
  .command('list')
  .description('List deployments')
  .option('--limit <number>', 'Number of results to return (default: 20)', '20')
  .option('--project <projectId>', 'Filter by project ID')
  .option('--state <state>', 'Filter by state (BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED)')
  .option('--target <target>', 'Filter by target environment (production, staging, preview)')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const params = {
        limit: parseInt(options.limit),
        teamId: options.team || getConfig('teamId')
      };

      if (options.project) params.projectId = options.project;
      if (options.state) params.state = options.state;
      if (options.target) params.target = options.target;

      const data = await withSpinner('Fetching deployments...', () =>
        makeRequest('GET', '/v6/deployments', null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const deployments = data.deployments || [];

      console.log(chalk.bold('\nDeployments\n'));

      printTable(deployments, [
        { key: 'uid', label: 'ID', format: (v) => truncate(v, 12) },
        { key: 'name', label: 'Name', format: (v) => truncate(v, 25) },
        { key: 'state', label: 'State', format: (v) => {
          if (v === 'READY') return chalk.green(v);
          if (v === 'ERROR' || v === 'CANCELED') return chalk.red(v);
          return chalk.yellow(v);
        }},
        { key: 'target', label: 'Target', format: (v) => {
          if (v === 'production') return chalk.cyan(v);
          return v;
        }},
        { key: 'created', label: 'Created', format: (v) => {
          const date = new Date(v);
          return date.toLocaleString();
        }}
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

deploymentsCmd
  .command('get <id>')
  .description('Get deployment details')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    requireAuth();

    try {
      const params = {
        teamId: options.team || getConfig('teamId')
      };

      const data = await withSpinner(`Fetching deployment ${id}...`, () =>
        makeRequest('GET', `/v13/deployments/${id}`, null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nDeployment Details\n'));
      console.log('ID:              ', chalk.cyan(data.uid || data.id));
      console.log('Name:            ', data.name || 'N/A');
      console.log('URL:             ', data.url ? chalk.underline(`https://${data.url}`) : 'N/A');
      console.log('State:           ', data.state === 'READY' ? chalk.green(data.state) : chalk.yellow(data.state));
      console.log('Target:          ', data.target || 'N/A');
      console.log('Project:         ', data.projectId || 'N/A');
      console.log('Created:         ', formatDate(data.created || data.createdAt));
      console.log('Created By:      ', data.creator?.username || 'N/A');

      if (data.meta) {
        console.log('\nMeta:');
        console.log('  Git Commit:    ', data.meta.githubCommitSha || 'N/A');
        console.log('  Git Branch:    ', data.meta.githubCommitRef || 'N/A');
        console.log('  Git Repo:      ', data.meta.githubCommitRepo || 'N/A');
      }

      if (data.alias && data.alias.length > 0) {
        console.log('\nAliases:');
        data.alias.forEach(a => console.log('  • ' + chalk.underline(`https://${a}`)));
      }

      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PROJECTS
// ============================================================

const projectsCmd = program.command('projects').description('Manage projects');

projectsCmd
  .command('list')
  .description('List projects')
  .option('--limit <number>', 'Number of results to return (default: 20)', '20')
  .option('--search <query>', 'Search projects by name')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const params = {
        limit: parseInt(options.limit),
        teamId: options.team || getConfig('teamId')
      };

      if (options.search) params.search = options.search;

      const data = await withSpinner('Fetching projects...', () =>
        makeRequest('GET', '/v9/projects', null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const projects = data.projects || [];

      console.log(chalk.bold('\nProjects\n'));

      printTable(projects, [
        { key: 'id', label: 'ID', format: (v) => truncate(v, 20) },
        { key: 'name', label: 'Name', format: (v) => truncate(v, 30) },
        { key: 'framework', label: 'Framework', format: (v) => v || 'N/A' },
        { key: 'updatedAt', label: 'Updated', format: (v) => {
          const date = new Date(v);
          return date.toLocaleDateString();
        }}
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

projectsCmd
  .command('get <id>')
  .description('Get project details')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    requireAuth();

    try {
      const params = {
        teamId: options.team || getConfig('teamId')
      };

      const data = await withSpinner(`Fetching project ${id}...`, () =>
        makeRequest('GET', `/v9/projects/${id}`, null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nProject Details\n'));
      console.log('ID:              ', chalk.cyan(data.id));
      console.log('Name:            ', data.name);
      console.log('Framework:       ', data.framework || 'N/A');
      console.log('Build Command:   ', data.buildCommand || 'N/A');
      console.log('Dev Command:     ', data.devCommand || 'N/A');
      console.log('Install Command: ', data.installCommand || 'N/A');
      console.log('Output Dir:      ', data.outputDirectory || 'N/A');
      console.log('Root Dir:        ', data.rootDirectory || '/');
      console.log('Node Version:    ', data.nodeVersion || 'N/A');
      console.log('Created:         ', formatDate(data.createdAt));
      console.log('Updated:         ', formatDate(data.updatedAt));

      if (data.link) {
        console.log('\nGit Repository:');
        console.log('  Type:          ', data.link.type || 'N/A');
        console.log('  Repo:          ', data.link.repo || 'N/A');
        console.log('  Production:    ', data.link.productionBranch || 'N/A');
      }

      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// DOMAINS
// ============================================================

const domainsCmd = program.command('domains').description('Manage domains');

domainsCmd
  .command('list')
  .description('List domains')
  .option('--limit <number>', 'Number of results to return (default: 20)', '20')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const params = {
        limit: parseInt(options.limit),
        teamId: options.team || getConfig('teamId')
      };

      const data = await withSpinner('Fetching domains...', () =>
        makeRequest('GET', '/v5/domains', null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const domains = data.domains || [];

      console.log(chalk.bold('\nDomains\n'));

      printTable(domains, [
        { key: 'name', label: 'Domain', format: (v) => chalk.cyan(v) },
        { key: 'verified', label: 'Verified', format: (v) => v ? chalk.green('✓') : chalk.yellow('✗') },
        { key: 'createdAt', label: 'Created', format: (v) => {
          const date = new Date(v);
          return date.toLocaleDateString();
        }}
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// LOGS
// ============================================================

const logsCmd = program.command('logs').description('Get deployment logs');

logsCmd
  .command('get <deployment-id>')
  .description('Get deployment logs and events')
  .option('--limit <number>', 'Number of events to return (default: 100)', '100')
  .option('--follow', 'Follow logs in real-time')
  .option('--builds', 'Include build events')
  .option('--team <teamId>', 'Team ID (overrides config)')
  .option('--json', 'Output as JSON')
  .action(async (deploymentId, options) => {
    requireAuth();

    try {
      const params = {
        limit: parseInt(options.limit),
        teamId: options.team || getConfig('teamId')
      };

      if (options.follow) params.follow = '1';
      if (options.builds) params.builds = '1';

      const data = await withSpinner(`Fetching logs for ${deploymentId}...`, () =>
        makeRequest('GET', `/v2/deployments/${deploymentId}/events`, null, params)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nDeployment Logs: ${deploymentId}\n`));

      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log(chalk.yellow('No events found.'));
        return;
      }

      // Handle different response formats
      const events = Array.isArray(data) ? data : (data.events || []);

      events.forEach(event => {
        const timestamp = event.created ? new Date(event.created).toLocaleTimeString() : '';
        const type = event.type || event.name || 'unknown';
        const payload = event.payload || event.text || '';

        let typeColor = chalk.white;
        if (type.includes('error') || type.includes('failed')) typeColor = chalk.red;
        else if (type.includes('success') || type.includes('ready')) typeColor = chalk.green;
        else if (type.includes('building') || type.includes('deploying')) typeColor = chalk.yellow;

        console.log(`${chalk.dim(timestamp)} ${typeColor(type.padEnd(20))} ${payload}`);
      });

      console.log(chalk.dim(`\n${events.length} event(s)`));
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
