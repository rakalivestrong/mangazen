// Comments service — localStorage based, per chapter

export interface Comment {
  id: string;
  chapterId: string;
  userId: string;
  username: string;
  avatarColor: string;
  content: string;
  createdAt: number;
}

const COMMENTS_KEY = 'mangazen_comments';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getAllComments(): Record<string, Comment[]> {
  const data = localStorage.getItem(COMMENTS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveAllComments(all: Record<string, Comment[]>) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
}

export const CommentService = {
  getComments(chapterId: string): Comment[] {
    const all = getAllComments();
    return (all[chapterId] || []).sort((a, b) => b.createdAt - a.createdAt);
  },

  addComment(
    chapterId: string,
    userId: string,
    username: string,
    avatarColor: string,
    content: string
  ): Comment {
    const all = getAllComments();
    if (!all[chapterId]) all[chapterId] = [];

    const comment: Comment = {
      id: generateId(),
      chapterId,
      userId,
      username,
      avatarColor,
      content: content.trim(),
      createdAt: Date.now(),
    };

    all[chapterId].unshift(comment);
    saveAllComments(all);
    return comment;
  },

  deleteComment(chapterId: string, commentId: string, userId: string): boolean {
    const all = getAllComments();
    if (!all[chapterId]) return false;

    const before = all[chapterId].length;
    all[chapterId] = all[chapterId].filter(
      c => !(c.id === commentId && c.userId === userId)
    );

    if (all[chapterId].length < before) {
      saveAllComments(all);
      return true;
    }
    return false;
  },

  getTotalCommentCount(chapterId: string): number {
    const all = getAllComments();
    return (all[chapterId] || []).length;
  },
};
