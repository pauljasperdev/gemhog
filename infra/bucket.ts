export const podcastBucket = new sst.aws.Bucket("PodcastBucket");

const readerUser = new aws.iam.User("PodcastBucketReader", {
  name: $interpolate`gemhog-podcast-reader-${$app.stage}`,
});

const policy = podcastBucket.arn.apply((arn) =>
  JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["s3:ListBucket"],
        Resource: [arn],
      },
      {
        Effect: "Allow",
        Action: ["s3:GetObject"],
        Resource: [`${arn}/*`],
      },
    ],
  }),
);

new aws.iam.UserPolicy("PodcastBucketReaderPolicy", {
  user: readerUser.name,
  policy,
});

const readerKey = new aws.iam.AccessKey("PodcastBucketReaderKey", {
  user: readerUser.name,
});

export const outputs = {
  bucketName: podcastBucket.name,
  readerAccessKeyId: readerKey.id,
  readerSecretAccessKey: readerKey.secret,
};
