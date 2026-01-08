// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const GoalStatus = {
  "ACTIVE": "active",
  "PAUSED": "paused",
  "COMPLETED": "completed",
  "ARCHIVED": "archived"
};

const TaskStatus = {
  "OPEN": "open",
  "IN_PROGRESS": "in_progress",
  "DONE": "done",
  "CANCELED": "canceled"
};

const { User, Answer, Goal, Task, Message, Offer } = initSchema(schema);

export {
  GoalStatus,
  TaskStatus,
  User,
  Answer,
  Goal,
  Task,
  Message,
  Offer
};