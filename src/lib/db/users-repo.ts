import { db } from "./firebase-admin";
import type { User } from "@/types";

const COL = "usuarios";

interface UserDoc extends User {
  passwordHash: string;
}

export async function getUsers(): Promise<User[]> {
  const snap = await db.collection(COL).get();
  return snap.docs.map((d) => {
    const { passwordHash: _ph, ...user } = d.data() as UserDoc;
    return user as User;
  });
}

export async function getUser(id: string): Promise<User | null> {
  const doc = await db.collection(COL).doc(id).get();
  if (!doc.exists) return null;
  const { passwordHash: _ph, ...user } = doc.data() as UserDoc;
  return user as User;
}

export async function getUserByEmail(
  email: string
): Promise<{ user: User; passwordHash: string } | null> {
  const snap = await db.collection(COL).where("email", "==", email).limit(1).get();
  if (snap.empty) return null;
  const { passwordHash, ...user } = snap.docs[0].data() as UserDoc;
  return { user: user as User, passwordHash };
}

export async function createUser(data: User, passwordHash: string): Promise<User> {
  const ref = db.collection(COL).doc(data.id || db.collection(COL).doc().id);
  const doc: UserDoc = { ...data, id: ref.id, passwordHash };
  await ref.set(doc);
  const { passwordHash: _ph, ...user } = doc;
  return user as User;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<User, "id">>
): Promise<User | null> {
  const ref = db.collection(COL).doc(id);
  await ref.update(data as FirebaseFirestore.UpdateData<User>);
  const updated = await ref.get();
  if (!updated.exists) return null;
  const { passwordHash: _ph, ...user } = updated.data() as UserDoc;
  return user as User;
}
