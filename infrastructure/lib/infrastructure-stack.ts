import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import { join } from "path";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bucket = new s3.Bucket(this, "bucket", {
      bucketName: `${this.account}-${this.region}-cv`,
    });
    new s3Deployment.BucketDeployment(this, "deployment", {
      destinationBucket: bucket,
      sources: [
        s3Deployment.Source.asset(join(__dirname, "../.."), {
          exclude: ["**", "!cv.pdf"],
        }),
      ],
    });
  }
}
