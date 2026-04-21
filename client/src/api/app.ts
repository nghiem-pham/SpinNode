import { apiRequest, apiUpload } from "./client";

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
  profileVisible: boolean;
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
  applyUrl: string;
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

export interface ForumReplyResponse {
  id: number;
  author: {
    id: number;
    name: string;
    avatar: string;
  };
  content: string;
  upvotes: number;
  createdAt: string;
  threadId?: number;
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

export function fetchPublicProfile(userId: number) {
  return apiRequest<ProfileResponse>(`/api/profile/${userId}`);
}

export function updateProfile(data: UpdateProfileRequest) {
  return apiRequest<ProfileResponse>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiRequest<void>("/api/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function updateVisibility(profileVisible: boolean): Promise<void> {
  return apiRequest<void>("/api/profile/visibility", {
    method: "PATCH",
    body: JSON.stringify({ profileVisible }),
  });
}

// ── Job Preferences / Onboarding ─────────────────────────────────────────────

export interface PreferencesResponse {
  experienceLevel: string;
  jobTypes: string[];
  remotePref: string;
  preferredLocations: string[];
  preferredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  onboardingComplete: boolean;
}

export interface SavePreferencesRequest {
  experienceLevel: string;
  jobTypes: string[];
  remotePref: string;
  preferredLocations: string[];
  preferredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
}

export function fetchPreferences() {
  return apiRequest<PreferencesResponse>("/api/me/preferences");
}

export function savePreferences(data: SavePreferencesRequest) {
  return apiRequest<PreferencesResponse>("/api/me/preferences", {
    method: "POST",
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

export function deleteForumThread(threadId: number) {
  return apiRequest<void>(`/api/forums/threads/${threadId}`, { method: "DELETE" });
}

export function fetchThread(threadId: number) {
  return apiRequest<ForumThreadResponse>(`/api/forums/threads/${threadId}`);
}

export function fetchReplies(threadId: number) {
  return apiRequest<ForumReplyResponse[]>(`/api/forums/threads/${threadId}/replies`);
}

export function createReply(threadId: number, content: string) {
  return apiRequest<ForumReplyResponse>(`/api/forums/threads/${threadId}/replies`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function fetchThreadsByUser(userId: number) {
  return apiRequest<ForumThreadResponse[]>(`/api/forums/users/${userId}/threads`);
}

export function fetchRepliesByUser(userId: number) {
  return apiRequest<ForumReplyResponse[]>(`/api/forums/users/${userId}/replies`);
}

export function fetchLikedThreadsByUser(userId: number) {
  return apiRequest<ForumThreadResponse[]>(`/api/forums/users/${userId}/liked-threads`);
}

export function toggleThreadUpvote(threadId: number) {
  return apiRequest<ForumThreadResponse>(`/api/forums/threads/${threadId}/upvote`, {
    method: "POST",
  });
}

// ── People / Users ────────────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  displayName: string;
  role: string;
  avatar: string;
  followersCount: number;
  following: boolean;
}

export interface FollowResponse {
  userId: number;
  following: boolean;
  followersCount: number;
  followingCount: number;
}

export function fetchUsers(query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiRequest<UserSummary[]>(`/api/users${qs}`);
}

export function toggleFollow(userId: number) {
  return apiRequest<FollowResponse>(`/api/users/${userId}/follow`, { method: "POST" });
}

// ── Resume ────────────────────────────────────────────────────────────────────

export interface ResumeParseResponse {
  profile: {
    name: string;
    bio: string;
    location: string;
    skills: Array<{ name: string; level: string }>;
    experiences: Array<{ title: string; company: string; duration: string; description: string }>;
    projects: Array<{ name: string; description: string; technologies: string[]; link?: string }>;
  };
  suggestedJobs: JobResponse[];
}

export function parseResume(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiUpload<ResumeParseResponse>("/api/resume/parse", form);
}

// ── AI Assistant ──────────────────────────────────────────────────────────────

export interface CoverLetterRequest {
  jobTitle: string;
  company: string;
  jobDescription?: string;
  skills?: string[];
  applicantName?: string;
}

export function generateCoverLetter(data: CoverLetterRequest) {
  return apiRequest<{ text: string }>("/api/ai/cover-letter", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function aiChat(message: string) {
  return apiRequest<{ text: string }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function searchApi(query: string) {
  return apiRequest<SearchResultResponse[]>(`/api/search?query=${encodeURIComponent(query)}`);
}

export function createConversation(participantUserId: number, message: string) {
  return apiRequest<ConversationResponse>("/api/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ participantUserId, message }),
  });
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
