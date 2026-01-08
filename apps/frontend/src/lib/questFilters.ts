/**
 * Quest Filtering Utilities for GoalsGuild Application
 *
 * This module provides utility functions for filtering, sorting, and managing
 * quest collections with type-safe operations and performance optimizations.
 *
 * Exports:
 * - filterQuests(quests, filters) - Filter quests by criteria
 * - sortQuests(quests, sortBy, sortOrder) - Sort quests by various criteria
 * - getUniqueCategories(quests) - Extract unique categories
 * - getFilterStats(quests, filters) - Get filtering statistics
 * - validateFilters(filters) - Validate filter object
 */

import type { Quest } from '@/models/quest';
import type { QuestFilters } from '@/hooks/useQuestFilters';

/** Sort options for quests */
export type QuestSortBy = 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'rewardXp' | 'status';

/** Sort order options */
export type QuestSortOrder = 'asc' | 'desc';

/** Filtering statistics */
export interface QuestFilterStats {
  total: number;
  filtered: number;
  activeFilters: string[];
}

/** Difficulty level weights for sorting */
const DIFFICULTY_WEIGHTS = {
  easy: 1,
  medium: 2,
  hard: 3,
} as const;

/** Status priority weights for sorting */
const STATUS_WEIGHTS = {
  draft: 1,
  active: 2,
  completed: 3,
  cancelled: 4,
  failed: 5,
} as const;

/**
 * Filter quests based on provided criteria
 *
 * @param quests - Array of quests to filter
 * @param filters - Filter criteria
 * @returns Filtered array of quests
 */
export function filterQuests(quests: Quest[], filters: QuestFilters): Quest[] {
  if (!quests || !Array.isArray(quests)) {
    return [];
  }

  const result = quests.filter((quest: Quest) => {
    // Status filter
    if (filters.status !== 'all' && quest.status !== filters.status) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty !== 'all' && quest.difficulty !== filters.difficulty) {
      return false;
    }

    // Category filter
    if (filters.category !== 'all' && quest.category !== filters.category) {
      return false;
    }

    // Search filter (case-insensitive)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      const searchableFields = [
        quest.title,
        quest.description,
        quest.category,
        quest.tags?.join(' '),
      ].filter(Boolean);

      const matchesSearch = searchableFields.some(field =>
        field!.toLowerCase().includes(searchTerm)
      );

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  return result;
}

/**
 * Sort quests by specified criteria
 *
 * @param quests - Array of quests to sort
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order ('asc' | 'desc')
 * @returns Sorted array of quests
 */
export function sortQuests(
  quests: Quest[],
  sortBy: QuestSortBy = 'createdAt',
  sortOrder: QuestSortOrder = 'desc'
): Quest[] {
  if (!quests || !Array.isArray(quests)) {
    return [];
  }

  const sorted = [...quests].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;

      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;

      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;

      case 'difficulty':
        comparison = (DIFFICULTY_WEIGHTS[a.difficulty] || 0) - (DIFFICULTY_WEIGHTS[b.difficulty] || 0);
        break;

      case 'rewardXp':
        comparison = (a.rewardXp || 0) - (b.rewardXp || 0);
        break;

      case 'status':
        comparison = (STATUS_WEIGHTS[a.status] || 0) - (STATUS_WEIGHTS[b.status] || 0);
        break;

      default:
        comparison = 0;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Filter and sort quests in one operation for performance
 *
 * @param quests - Array of quests to process
 * @param filters - Filter criteria
 * @param sortBy - Sort field
 * @param sortOrder - Sort order
 * @returns Filtered and sorted array of quests
 */
export function filterAndSortQuests(
  quests: Quest[],
  filters: QuestFilters,
  sortBy: QuestSortBy = 'createdAt',
  sortOrder: QuestSortOrder = 'desc'
): Quest[] {
  const filtered = filterQuests(quests, filters);
  return sortQuests(filtered, sortBy, sortOrder);
}

/**
 * Extract unique categories from quests
 *
 * @param quests - Array of quests
 * @returns Array of unique category strings
 */
export function getUniqueCategories(quests: Quest[]): string[] {
  if (!quests || !Array.isArray(quests)) {
    return [];
  }

  const categories = new Set<string>();
  quests.forEach(quest => {
    if (quest.category && quest.category.trim()) {
      categories.add(quest.category.trim());
    }
  });

  return Array.from(categories).sort();
}

/**
 * Get filtering statistics
 *
 * @param quests - Original quests array
 * @param filters - Applied filters
 * @returns Statistics about filtering results
 */
export function getFilterStats(quests: Quest[], filters: QuestFilters): QuestFilterStats {
  const total = quests?.length || 0;
  const filtered = filterQuests(quests || [], filters).length;

  const activeFilters: string[] = [];
  if (filters.status !== 'all') activeFilters.push(`Status: ${filters.status}`);
  if (filters.difficulty !== 'all') activeFilters.push(`Difficulty: ${filters.difficulty}`);
  if (filters.category !== 'all') activeFilters.push(`Category: ${filters.category}`);
  if (filters.search && filters.search.trim()) activeFilters.push(`Search: "${filters.search.trim()}"`);

  return {
    total,
    filtered,
    activeFilters,
  };
}

/**
 * Validate filter object
 *
 * @param filters - Filter object to validate
 * @returns True if filters are valid
 */
export function validateFilters(filters: any): filters is QuestFilters {
  if (!filters || typeof filters !== 'object') {
    return false;
  }

  const requiredKeys: (keyof QuestFilters)[] = ['status', 'difficulty', 'category', 'search'];

  return requiredKeys.every(key => {
    if (key === 'search') {
      return typeof filters[key] === 'string';
    }
    return typeof filters[key] === 'string' && filters[key] !== undefined;
  });
}

/**
 * Create default filters object
 *
 * @param overrides - Partial overrides for default values
 * @returns Complete filters object
 */
export function createDefaultFilters(overrides: Partial<QuestFilters> = {}): QuestFilters {
  return {
    status: 'all',
    difficulty: 'all',
    category: 'all',
    search: '',
    ...overrides,
  };
}

/**
 * Check if any filters are active (not set to default values)
 *
 * @param filters - Filter object to check
 * @returns True if any filters are active
 */
export function hasActiveFilters(filters: QuestFilters): boolean {
  return (
    filters.status !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.category !== 'all' ||
    (filters.search && filters.search.trim() !== '')
  );
}

/**
 * Get count of active filters
 *
 * @param filters - Filter object to check
 * @returns Number of active filters
 */
export function getActiveFilterCount(filters: QuestFilters): number {
  let count = 0;
  if (filters.status !== 'all') count++;
  if (filters.difficulty !== 'all') count++;
  if (filters.category !== 'all') count++;
  if (filters.search && filters.search.trim() !== '') count++;
  return count;
}
