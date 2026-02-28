'use client';

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: '/help',
    description: 'Show all available commands',
    usage: '/help',
    examples: ['/help'],
  },
  {
    name: '/status',
    description: 'Show system status, uptime, and agent health',
    usage: '/status',
    examples: ['/status'],
  },
  {
    name: '/agents',
    description: 'List all agents with their current status and model',
    usage: '/agents',
    examples: ['/agents'],
  },
  {
    name: '/cost',
    description: 'Show current session cost and token usage',
    usage: '/cost [period]',
    examples: ['/cost', '/cost today', '/cost week'],
  },
  {
    name: '/memory',
    description: 'Search or browse agent memories',
    usage: '/memory [search query]',
    examples: ['/memory', '/memory eidrix', '/memory recent'],
  },
  {
    name: '/projects',
    description: 'List active projects and their status',
    usage: '/projects',
    examples: ['/projects'],
  },
  {
    name: '/task',
    description: 'Create a new task or list tasks',
    usage: '/task [create <title>] | /task list',
    examples: ['/task list', '/task create Fix mobile layout'],
  },
  {
    name: '/research',
    description: 'Run a research query through the pipeline',
    usage: '/research <query>',
    examples: ['/research contractor AI tools 2026', '/research competitor analysis'],
  },
  {
    name: '/email',
    description: 'Check email inbox or send an email',
    usage: '/email [inbox|send <to> <subject>]',
    examples: ['/email inbox', '/email unread'],
  },
  {
    name: '/clear',
    description: 'Clear the current chat thread',
    usage: '/clear',
    examples: ['/clear'],
  },
];

export function matchCommands(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return [];
  const query = input.toLowerCase();
  return SLASH_COMMANDS.filter((cmd) =>
    cmd.name.startsWith(query) || cmd.description.toLowerCase().includes(query.slice(1))
  );
}