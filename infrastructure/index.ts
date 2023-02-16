#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { join } from "path";

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const cvFilename = "cv.pdf";
    const hostedZoneDomainName = "tinasour.click";
    const cvDomainName = `cv.${hostedZoneDomainName}`;
    const bucket = new s3.Bucket(this, "bucket", {
      bucketName: `${this.account}-${this.region}-cv`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    new s3Deployment.BucketDeployment(this, "deployment", {
      destinationBucket: bucket,
      sources: [
        s3Deployment.Source.asset(join(__dirname, ".."), {
          exclude: ["**", `!${cvFilename}`],
        }),
      ],
    });
    const hostedZone = route53.HostedZone.fromLookup(this, "hostedzone", {
      domainName: hostedZoneDomainName,
    });
    const certificate = new acm.Certificate(this, "mySiteCert", {
      domainName: cvDomainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
    const distribution = new cloudfront.Distribution(this, "dist", {
      defaultBehavior: { origin: new cloudfrontOrigins.S3Origin(bucket) },
      defaultRootObject: cvFilename,
      certificate: certificate,
      domainNames: [cvDomainName],
    });
    new route53.ARecord(this, "record", {
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
      zone: hostedZone,
      recordName: "cv",
    });
  }
}

const app = new cdk.App();
new MainStack(app, "cv", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // this stack has to be deployed on us-east-1 since it is responsible from cloudfront certificate
  },
});
