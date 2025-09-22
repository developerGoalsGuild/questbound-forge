import { ModelInit, MutableModel } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";

export enum GoalStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

export enum TaskStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  DONE = "done",
  CANCELED = "canceled"
}

type EagerUser = {
  readonly id: string;
  readonly email?: string | null;
  readonly fullName?: string | null;
  readonly nickname?: string | null;
  readonly birthDate?: string | null;
  readonly status?: string | null;
  readonly country?: string | null;
  readonly language?: string | null;
  readonly gender?: string | null;
  readonly pronouns?: string | null;
  readonly bio?: string | null;
  readonly tags: string[];
  readonly tier: string;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly ageYears?: number | null;
}

type LazyUser = {
  readonly id: string;
  readonly email?: string | null;
  readonly fullName?: string | null;
  readonly nickname?: string | null;
  readonly birthDate?: string | null;
  readonly status?: string | null;
  readonly country?: string | null;
  readonly language?: string | null;
  readonly gender?: string | null;
  readonly pronouns?: string | null;
  readonly bio?: string | null;
  readonly tags: string[];
  readonly tier: string;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly ageYears?: number | null;
}

export declare type User = LazyLoading extends LazyLoadingDisabled ? EagerUser : LazyUser

export declare const User: (new (init: ModelInit<User>) => User)

type EagerAnswer = {
  readonly key: string;
  readonly answer: string;
}

type LazyAnswer = {
  readonly key: string;
  readonly answer: string;
}

export declare type Answer = LazyLoading extends LazyLoadingDisabled ? EagerAnswer : LazyAnswer

export declare const Answer: (new (init: ModelInit<Answer>) => Answer)

type EagerGoal = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly tags?: string[] | null;
  readonly deadline?: string | null;
  readonly status: GoalStatus | keyof typeof GoalStatus;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly answers?: Answer[] | null;
}

type LazyGoal = {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly tags?: string[] | null;
  readonly deadline?: string | null;
  readonly status: GoalStatus | keyof typeof GoalStatus;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
  readonly answers?: Answer[] | null;
}

export declare type Goal = LazyLoading extends LazyLoadingDisabled ? EagerGoal : LazyGoal

export declare const Goal: (new (init: ModelInit<Goal>) => Goal)

type EagerTask = {
  readonly id: string;
  readonly goalId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly nlpPlan?: string | null;
  readonly dueAt?: number | null;
  readonly status: TaskStatus | keyof typeof TaskStatus;
  readonly assignees?: string[] | null;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
}

type LazyTask = {
  readonly id: string;
  readonly goalId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly nlpPlan?: string | null;
  readonly dueAt?: number | null;
  readonly status: TaskStatus | keyof typeof TaskStatus;
  readonly assignees?: string[] | null;
  readonly createdAt?: number | null;
  readonly updatedAt?: number | null;
}

export declare type Task = LazyLoading extends LazyLoadingDisabled ? EagerTask : LazyTask

export declare const Task: (new (init: ModelInit<Task>) => Task)

type EagerMessage = {
  readonly id: string;
  readonly roomId: string;
  readonly senderId: string;
  readonly text: string;
  readonly ts: number;
}

type LazyMessage = {
  readonly id: string;
  readonly roomId: string;
  readonly senderId: string;
  readonly text: string;
  readonly ts: number;
}

export declare type Message = LazyLoading extends LazyLoadingDisabled ? EagerMessage : LazyMessage

export declare const Message: (new (init: ModelInit<Message>) => Message)

type EagerOffer = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly tags?: string[] | null;
  readonly validTo?: string | null;
}

type LazyOffer = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly tags?: string[] | null;
  readonly validTo?: string | null;
}

export declare type Offer = LazyLoading extends LazyLoadingDisabled ? EagerOffer : LazyOffer

export declare const Offer: (new (init: ModelInit<Offer>) => Offer)

