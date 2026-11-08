import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  circleMembers,
  circles,
  loans,
  notifications,
  repayments,
  user,
} from "@/db/schema";
import type { LoanView, RepaymentView } from "@/lib/types";

export async function getMyCircles(userId: string) {
  return db
    .select({
      id: circles.id,
      name: circles.name,
      role: circleMembers.role,
      memberCount: sql<number>`(select count(*) from circle_members cm where cm.circle_id = ${circles.id})`.mapWith(
        Number
      ),
    })
    .from(circleMembers)
    .innerJoin(circles, eq(circles.id, circleMembers.circleId))
    .where(eq(circleMembers.userId, userId))
    .orderBy(desc(circleMembers.joinedAt));
}

/** Returns the circle only if `userId` is a member. Otherwise null. */
export async function getCircleForMember(circleId: string, userId: string) {
  const [row] = await db
    .select({
      id: circles.id,
      name: circles.name,
      inviteCode: circles.inviteCode,
      role: circleMembers.role,
    })
    .from(circleMembers)
    .innerJoin(circles, eq(circles.id, circleMembers.circleId))
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getCircleMembers(circleId: string) {
  return db
    .select({ id: user.id, name: user.name, role: circleMembers.role })
    .from(circleMembers)
    .innerJoin(user, eq(user.id, circleMembers.userId))
    .where(eq(circleMembers.circleId, circleId))
    .orderBy(user.name);
}

/**
 * Everyone in the circle sees pending + confirmed loans.
 * Rejected / cancelled ones are visible only to the two people involved.
 * (Caller must already have verified circle membership.)
 */
export async function getCircleLoans(circleId: string, viewerId: string) {
  const lender = alias(user, "lender");
  const borrower = alias(user, "borrower");

  const loanRows: LoanView[] = await db
    .select({
      id: loans.id,
      lenderId: loans.lenderId,
      borrowerId: loans.borrowerId,
      lenderName: lender.name,
      borrowerName: borrower.name,
      amount: loans.amount,
      note: loans.note,
      loanDate: loans.loanDate,
      status: loans.status,
    })
    .from(loans)
    .innerJoin(lender, eq(lender.id, loans.lenderId))
    .innerJoin(borrower, eq(borrower.id, loans.borrowerId))
    .where(
      and(
        eq(loans.circleId, circleId),
        or(
          inArray(loans.status, ["pending", "confirmed"]),
          eq(loans.lenderId, viewerId),
          eq(loans.borrowerId, viewerId)
        )
      )
    )
    .orderBy(desc(loans.loanDate), desc(loans.createdAt));

  let repaymentRows: RepaymentView[] = [];
  if (loanRows.length > 0) {
    const all = await db
      .select({
        id: repayments.id,
        loanId: repayments.loanId,
        amount: repayments.amount,
        paidDate: repayments.paidDate,
        note: repayments.note,
        status: repayments.status,
      })
      .from(repayments)
      .where(inArray(repayments.loanId, loanRows.map((l) => l.id)))
      .orderBy(desc(repayments.paidDate), desc(repayments.createdAt));

    const involved = new Set(
      loanRows
        .filter((l) => l.lenderId === viewerId || l.borrowerId === viewerId)
        .map((l) => l.id)
    );
    // disputed repayments are private to the lender & borrower
    repaymentRows = all.filter((r) => r.status !== "rejected" || involved.has(r.loanId));
  }

  return { loans: loanRows, repayments: repaymentRows };
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function getNotifications(userId: string) {
  const lender = alias(user, "lender");
  const borrower = alias(user, "borrower");
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      circleId: loans.circleId,
      circleName: circles.name,
      loanAmount: loans.amount,
      repaymentAmount: repayments.amount,
      lenderName: lender.name,
      borrowerName: borrower.name,
    })
    .from(notifications)
    .innerJoin(loans, eq(loans.id, notifications.loanId))
    .innerJoin(circles, eq(circles.id, loans.circleId))
    .innerJoin(lender, eq(lender.id, loans.lenderId))
    .innerJoin(borrower, eq(borrower.id, loans.borrowerId))
    .leftJoin(repayments, eq(repayments.id, notifications.repaymentId))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}
