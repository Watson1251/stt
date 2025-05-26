export interface Action {
    id: string;
    action: string;
    deviceId: string;
    accountId: string;
    timestamp: Number;
    isFinished: boolean;
    status: string;
    taskId: string;
    categoryId: string;
    tweetId: string;
    targetTweetId: string;
    mediaUrl: string;
    hashtag: string;
}
