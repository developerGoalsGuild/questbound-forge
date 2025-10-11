/**
 * Quest Template API client functions for GoalsGuild application.
 * 
 * This file provides API client functions for Quest Template operations
 * following the established patterns from apiQuest.ts.
 */

import { authFetch } from './api';
import { 
  QuestTemplate, 
  QuestTemplateCreateInput, 
  QuestTemplateUpdateInput, 
  QuestTemplateListResponse,
  QuestTemplateListOptions 
} from '@/models/questTemplate';
import { logger } from './logger';

/**
 * Create a new quest template
 */
export async function createQuestTemplate(input: QuestTemplateCreateInput): Promise<QuestTemplate> {
  logger.debug('Creating quest template', { input });

  try {
    const response = await authFetch('/quests/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to create template';
      logger.error('API Error: Create Template', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        input,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const template = await response.json();
    logger.info('Quest template created successfully', { templateId: template.id });
    return template;
  } catch (error) {
    logger.error('Failed to create quest template', { error, input });
    throw error;
  }
}

/**
 * Get a quest template by ID
 */
export async function getTemplate(id: string): Promise<QuestTemplate> {
  logger.debug('Getting quest template', { templateId: id });
  
  try {
    const response = await authFetch(`/quests/templates/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to get template';
      logger.error('API Error: Get Template', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        templateId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const template = await response.json();
    logger.info('Quest template retrieved successfully', { templateId: id });
    return template;
  } catch (error) {
    logger.error('Failed to get quest template', { error, templateId: id });
    throw error;
  }
}

/**
 * Update a quest template
 */
export async function updateTemplate(id: string, input: QuestTemplateUpdateInput): Promise<QuestTemplate> {
  logger.debug('Updating quest template', { templateId: id, input });
  
  try {
    const response = await authFetch(`/quests/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to update template';
      logger.error('API Error: Update Template', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        templateId: id,
        input,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const template = await response.json();
    logger.info('Quest template updated successfully', { templateId: id });
    return template;
  } catch (error) {
    logger.error('Failed to update quest template', { error, templateId: id, input });
    throw error;
  }
}

/**
 * Delete a quest template
 */
export async function deleteTemplate(id: string): Promise<void> {
  logger.debug('Deleting quest template', { templateId: id });
  
  try {
    const response = await authFetch(`/quests/templates/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to delete template';
      logger.error('API Error: Delete Template', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        templateId: id,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    logger.info('Quest template deleted successfully', { templateId: id });
  } catch (error) {
    logger.error('Failed to delete quest template', { error, templateId: id });
    throw error;
  }
}

/**
 * List quest templates
 */
export async function listTemplates(options: QuestTemplateListOptions = {}): Promise<QuestTemplateListResponse> {
  // Build query parameters
  const queryParams = new URLSearchParams();
  if (options.limit) {
    queryParams.set('limit', options.limit.toString());
  }
  if (options.nextToken) {
    queryParams.set('next_token', options.nextToken);
  }
  if (options.privacy) {
    queryParams.set('privacy', options.privacy);
  }
  
  const queryString = queryParams.toString();
  const url = `/quests/templates${queryString ? `?${queryString}` : ''}`;
  
  logger.debug('Listing quest templates', { options });
  
  try {
    const response = await authFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_API_GATEWAY_KEY || '',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.detail || response.statusText || 'Failed to list templates';
      logger.error('API Error: List Templates', {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        options,
        timestamp: new Date().toISOString()
      });
      throw new Error(message);
    }

    const result = await response.json();
    logger.info('Quest templates listed successfully', { 
      count: result.templates?.length || 0, 
      total: result.total || 0 
    });
    return result;
  } catch (error) {
    logger.error('Failed to list quest templates', { error, options });
    throw error;
  }
}

/**
 * List user's quest templates
 */
export async function listUserTemplates(options: Omit<QuestTemplateListOptions, 'privacy'> = {}): Promise<QuestTemplateListResponse> {
  return listTemplates({ ...options, privacy: 'user' });
}

/**
 * List public quest templates
 */
export async function listPublicTemplates(options: Omit<QuestTemplateListOptions, 'privacy'> = {}): Promise<QuestTemplateListResponse> {
  return listTemplates({ ...options, privacy: 'public' });
}

/**
 * Search quest templates
 */
export async function searchTemplates(
  query: string, 
  options: Omit<QuestTemplateListOptions, 'filters'> = {}
): Promise<QuestTemplateListResponse> {
  return listTemplates({
    ...options,
    filters: { search: query }
  });
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(
  category: string, 
  options: Omit<QuestTemplateListOptions, 'filters'> = {}
): Promise<QuestTemplateListResponse> {
  return listTemplates({
    ...options,
    filters: { category }
  });
}

/**
 * Get templates by difficulty
 */
export async function getTemplatesByDifficulty(
  difficulty: string, 
  options: Omit<QuestTemplateListOptions, 'filters'> = {}
): Promise<QuestTemplateListResponse> {
  return listTemplates({
    ...options,
    filters: { difficulty: difficulty as any }
  });
}

/**
 * Get templates by privacy level
 */
export async function getTemplatesByPrivacy(
  privacy: 'public' | 'followers' | 'private', 
  options: Omit<QuestTemplateListOptions, 'privacy'> = {}
): Promise<QuestTemplateListResponse> {
  return listTemplates({
    ...options,
    privacy: privacy as any
  });
}

/**
 * Get templates by kind
 */
export async function getTemplatesByKind(
  kind: string, 
  options: Omit<QuestTemplateListOptions, 'filters'> = {}
): Promise<QuestTemplateListResponse> {
  return listTemplates({
    ...options,
    filters: { kind: kind as any }
  });
}
