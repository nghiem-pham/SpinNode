import { apiRequest } from "./client";

export interface ProfileExperience {
  id: number;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProfileProject {
  id: number;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ProfileSkill {
  id: number;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface ProfileResponse {
  userId: number;
  name: string;
  email: string;
  bio: string;
  location: string;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt: string;
  experiences: ProfileExperience[];
  projects: ProfileProject[];
  skills: ProfileSkill[];
}

export interface UpdateProfileRequest {
  name: string;
  bio: string;
  location: string;
  avatarUrl?: string;
  coverUrl?: string;
  experiences: Array<{
    id?: number;
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  projects: Array<{
    id?: number;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  skills: Array<{
    id?: number;
    name: string;
    level: string;
  }>;
}

export interface JobResponse {
  id: number;
  company: {
    id: number;
    name: string;
    logo: string;
    industry: string;
    description: string;
  };
  title: string;
  location: string;
  type: string;
  salary: string;
  postedAt: string;
  description: string;
  requirements: string[];
  saved: boolean;
}

export interface NotificationResponse {
  id: number;
  type: "like" | "comment" | "follow" | "share";
  user: {
    id: number;
    name: string;
    avatar: string;
  };
  content?: string;
  postContent?: string;
  timestamp: string;
  read: boolean;
}

export interface ChallengeResponse {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  topics: string[];
  acceptance: string;
  submissions: string;
  leetcodeUrl: string;
  completed: boolean;
  completedAt?: string;
  dailyDate?: string;
}

export interface ChallengeOverviewResponse {
  currentStreak: number;
  completedCount: number;
  totalPoints: number;
  dailyChallenge: ChallengeResponse;
  pastChallenges: ChallengeResponse[];
}

export interface ForumCategoryResponse {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  topics: number;
  posts: number;
  color: string;
}

export interface ForumThreadResponse {
  id: number;
  title: string;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  category: string;
  content: string;
  replies: number;
  views: number;
  upvotes: number;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
}

export interface SearchResultResponse {
  id: string;
  type: "job" | "company" | "user";
  title: string;
  subtitle: string;
  description: string;
  logo?: string;
  location?: string;
  salary?: string;
}

export interface MessageResponse {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface ConversationResponse {
  id: number;
  participantId: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  messages: MessageResponse[];
}

export function fetchProfile() {
  return apiRequest<ProfileResponse>("/api/profile");
}

export function updateProfile(data: UpdateProfileRequest) {
  return apiRequest<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function fetchJobs() {
  return apiRequest<JobResponse[]>("/api/jobs");
}

export function toggleSavedJob(jobId: number) {
  return apiRequest<JobResponse>(`/api/jobs/${jobId}/save`, {
    method: "POST",
  });
}

export function fetchNotifications(unreadOnly = false) {
  return apiRequest<NotificationResponse[]>(`/api/notifications?unreadOnly=${unreadOnly}`);
}

export function markNotificationRead(notificationId: number) {
  return apiRequest<void>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiRequest<void>("/api/notifications/read-all", {
    method: "PATCH",
  });
}

export function fetchChallenges() {
  return apiRequest<ChallengeOverviewResponse>("/api/challenges");
}

export function completeDailyChallenge() {
  return apiRequest<ChallengeResponse>("/api/challenges/daily/complete", {
    method: "POST",
  });
}

export function fetchForumCategories() {
  return apiRequest<ForumCategoryResponse[]>("/api/forums/categories");
}

export function fetchForumThreads(params: {
  category?: string | null;
  query?: string;
  sortBy?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.query) searchParams.set("query", params.query);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  const query = searchParams.toString();
  return apiRequest<ForumThreadResponse[]>(`/api/forums/threads${query ? `?${query}` : ""}`);
}

export function createForumThread(data: {
  categorySlug: string;
  title: string;
  content: string;
  tags: string[];
}) {
  return apiRequest<ForumThreadResponse>("/api/forums/threads", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function searchApi(query: string) {
  return apiRequest<SearchResultResponse[]>(`/api/search?query=${encodeURIComponent(query)}`);
}

export function fetchConversations() {
  return apiRequest<ConversationResponse[]>("/api/messages/conversations");
}

export function fetchConversationMessages(conversationId: number) {
  return apiRequest<MessageResponse[]>(`/api/messages/conversations/${conversationId}`);
}

export function sendConversationMessage(conversationId: number, message: string) {
  return apiRequest<MessageResponse>(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function markConversationRead(conversationId: number) {
  return apiRequest<void>(`/api/messages/conversations/${conversationId}/read`, {
    method: "POST",
  });
}
