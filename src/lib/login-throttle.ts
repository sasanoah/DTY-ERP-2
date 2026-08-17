import {createHmac} from 'node:crypto';
import {prisma} from './prisma';

const MAX_ATTEMPTS = 10;
const BLOCK_SECONDS = 10 * 60;

function normalizedUsername(username:string){
  return username.trim().normalize('NFKC').toLowerCase();
}

function throttleKey(username:string){
  const secret = process.env.LOGIN_THROTTLE_SECRET || process.env.SESSION_SECRET;
  if(!secret && process.env.NODE_ENV === 'production') throw new Error('LOGIN_THROTTLE_SECRET_REQUIRED');
  return createHmac('sha256',secret || 'DEV_ONLY_DTY_ERP_LOGIN_THROTTLE')
    .update(`login:${normalizedUsername(username)}`)
    .digest('hex');
}

type ThrottleRow={allowed:boolean;retryAfter:number};

export async function rateCheck(username:string){
  const key=throttleKey(username);
  const rows=await prisma.$queryRaw<ThrottleRow[]>`
    WITH cleanup AS (
      DELETE FROM "LoginThrottle"
      WHERE "key" IN (
        SELECT "key" FROM "LoginThrottle"
        WHERE "updatedAt" < CURRENT_TIMESTAMP - INTERVAL '24 hours'
          AND "key" <> ${key}
        ORDER BY "updatedAt" ASC
        LIMIT 100
      )
    ), consumed AS (
      INSERT INTO "LoginThrottle" ("key", "attempts", "windowStartedAt", "blockedUntil", "updatedAt")
      VALUES (${key}, 1, CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE
          WHEN "LoginThrottle"."blockedUntil" > CURRENT_TIMESTAMP THEN "LoginThrottle"."attempts"
          WHEN "LoginThrottle"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 1
          ELSE "LoginThrottle"."attempts" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "LoginThrottle"."blockedUntil" > CURRENT_TIMESTAMP THEN "LoginThrottle"."windowStartedAt"
          WHEN "LoginThrottle"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN CURRENT_TIMESTAMP
          ELSE "LoginThrottle"."windowStartedAt"
        END,
        "blockedUntil" = CASE
          WHEN "LoginThrottle"."blockedUntil" > CURRENT_TIMESTAMP THEN "LoginThrottle"."blockedUntil"
          WHEN "LoginThrottle"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN NULL
          WHEN "LoginThrottle"."attempts" + 1 >= ${MAX_ATTEMPTS} THEN CURRENT_TIMESTAMP + INTERVAL '10 minutes'
          ELSE NULL
        END,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "blockedUntil"
    )
    SELECT
      ("blockedUntil" IS NULL OR "blockedUntil" <= CURRENT_TIMESTAMP) AS "allowed",
      CASE WHEN "blockedUntil" > CURRENT_TIMESTAMP
        THEN GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("blockedUntil" - CURRENT_TIMESTAMP)))::integer)
        ELSE 0
      END AS "retryAfter"
    FROM consumed
  `;
  return rows[0] || {allowed:false,retryAfter:BLOCK_SECONDS};
}

export async function clearRate(username:string){
  await prisma.loginThrottle.deleteMany({where:{key:throttleKey(username)}});
}
