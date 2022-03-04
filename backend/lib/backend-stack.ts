import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dialogflowFunc = new lambda.Function(this, 'DialogflowFunc', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'dialogflow.handler',
    });

    const api = new apigateway.RestApi(this, 'api', {
      restApiName: 'backend',
      cloudWatchRole: false,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        statusCode: 200,
      },
    });

    api.root.addMethod(
      'POST',
      new apigateway.LambdaIntegration(dialogflowFunc),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json; charset=UTF-8': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );
  }
}
