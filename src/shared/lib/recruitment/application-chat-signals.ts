type ApplicationLike = {
  id: string;
  user_id: string;
  status?: string;
  [key: string]: any;
};

type MessageLike = {
  application_id: string;
  author_id: string;
  created_at: string;
};

export function attachInterviewReplySignals(
  applications: ApplicationLike[],
  messages: MessageLike[],
) {
  const latestMessageAuthorByApplication = new Map<string, string>();

  for (const message of messages) {
    if (!latestMessageAuthorByApplication.has(message.application_id)) {
      latestMessageAuthorByApplication.set(
        message.application_id,
        message.author_id,
      );
    }
  }

  return applications.map((application) => ({
    ...application,
    hasNewApplicantMessage:
      application.status === "interview" &&
      latestMessageAuthorByApplication.get(application.id) ===
        application.user_id,
  }));
}
