export const Role = {
    Admin: "admin",
    User: "user",
} as const

// `Role` (type) is the union of the values: 'admin' | 'user'
export type Role = typeof Role[keyof typeof Role];

export type User = {
    id: string;
    name: string;
    age?: number;
    role: Role;
};

export interface Profile {
    userId: string;
    bio?: string;
    interests: string[];
}

/**
 * Combined type: a User plus an associated Profile.
 * profile is optional to allow a User that doesn't yet have a Profile.
 */
export type UserWithProfile = User & {
    profile?: Profile | null;
};


// runtime value that also gives an inferred literal type with `as const`
export const DEFAULT_USER = {
    id: '0',
    name: 'Guest',
    role: Role.User,
} as const;

export type DefaultUserType = typeof DEFAULT_USER;

// default profile tied to DEFAULT_USER.id
export const DEFAULT_PROFILE: Profile = {
    userId: DEFAULT_USER.id,
    bio: '',
    interests: [],
} as const;

export const DEFAULT_USER_WITH_PROFILE = {
    ...DEFAULT_USER,
    profile: DEFAULT_PROFILE,
} as const;

export type DefaultUserWithProfileType = typeof DEFAULT_USER_WITH_PROFILE;


/* ---------------- Runtime helpers / factories ---------------- */

export function isRole(value: unknown): value is Role {
    return Object.values(Role).includes(value as any);
}

export function isProfile(value: unknown): value is Profile {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Profile;
    return (
        typeof v.userId === 'string' &&
        typeof v.interests !== 'undefined' &&
        Array.isArray(v.interests)
    );
}

export function isUser(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as User;
    return typeof v.id === 'string' && typeof v.name === 'string' && isRole(v.role);
}

export function makeUser(name: string, id = Math.random().toString(36).slice(2)): User {
    return { id, name, role: Role.User };
}

export function makeProfile(userId: string, bio = '', interests: string[] = []): Profile {
    return { userId, bio, interests };
}

/** Create a User with a fresh Profile (profile.userId === user.id) */
export function makeUserWithProfile(
    name: string,
    bio = '',
    interests: string[] = []
): UserWithProfile {
    const user = makeUser(name);
    const profile = makeProfile(user.id, bio, interests);
    return { ...user, profile };
}

/** Merge a User and Profile into a UserWithProfile - enforces matching ids. */
export function mergeUserAndProfile(user: User, profile: Profile): UserWithProfile {
    if (user.id !== profile.userId) {
        throw new Error(`mergeUserAndProfile: mismatched ids (user.id=${user.id} profile.userId=${profile.userId})`);
    }
    return { ...user, profile };
}

/* ---------------- Small convenience utilities ---------------- */

/** Build a one-line summary for display (works for User or UserWithProfile) */
export function userSummary(u: User | UserWithProfile): string {
    const age = u.age ? ` • ${u.age}` : '';
    const hasBio = 'profile' in u && u.profile ? ` — ${u.profile.bio ?? ''}` : '';
    return `${u.name}${age} (${u.role})${hasBio}`;
}