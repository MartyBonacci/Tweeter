CREATE TABLE "tweeter_follows" (
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tweeter_follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "tweeter_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(100),
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tweeter_users_username_unique" UNIQUE("username"),
	CONSTRAINT "tweeter_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tweeter_tweets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tweeter_likes" (
	"user_id" uuid NOT NULL,
	"tweet_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tweeter_likes_user_id_tweet_id_pk" PRIMARY KEY("user_id","tweet_id")
);
--> statement-breakpoint
ALTER TABLE "tweeter_follows" ADD CONSTRAINT "tweeter_follows_follower_id_tweeter_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."tweeter_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweeter_follows" ADD CONSTRAINT "tweeter_follows_following_id_tweeter_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."tweeter_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweeter_tweets" ADD CONSTRAINT "tweeter_tweets_user_id_tweeter_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tweeter_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweeter_likes" ADD CONSTRAINT "tweeter_likes_user_id_tweeter_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tweeter_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweeter_likes" ADD CONSTRAINT "tweeter_likes_tweet_id_tweeter_tweets_id_fk" FOREIGN KEY ("tweet_id") REFERENCES "public"."tweeter_tweets"("id") ON DELETE cascade ON UPDATE no action;