#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import { join } from "path";

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bucket = new s3.Bucket(this, "bucket", {
      bucketName: `${this.account}-${this.region}-cv`,
    });
    const cvFilename = "cv.pdf";
    new s3Deployment.BucketDeployment(this, "deployment", {
      destinationBucket: bucket,
      sources: [
        s3Deployment.Source.asset(join(__dirname, "../.."), {
          exclude: ["**", `!${cvFilename}`],
        }),
      ],
    });
    new cloudfront.Distribution(this, "dist", {
      defaultBehavior: { origin: new cloudfrontOrigins.S3Origin(bucket) },
      defaultRootObject: cvFilename,
    });
  }
}

const app = new cdk.App();
new MainStack(app, "cv", {});