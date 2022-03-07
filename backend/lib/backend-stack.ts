import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lex from 'aws-cdk-lib/aws-lex';

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lexRole = new iam.Role(this, 'LexRole', {
      assumedBy: new iam.ServicePrincipal('lex.amazonaws.com'),
    });

    const promptMaxRetriesCount: number = 3;

    const dateOfBirthSlot: lex.CfnBot.SlotProperty = {
      name: 'DateOfBirth',
      slotTypeName: 'AMAZON.Date',
      valueElicitationSetting: {
        slotConstraint: 'Required',
        promptSpecification: {
          maxRetries: promptMaxRetriesCount,
          messageGroupsList: [
            {
              message: {
                plainTextMessage: {
                  value: '生年月日を教えてください。',
                },
              },
            },
          ],
        },
      },
    };

    const signUpIntent: lex.CfnBot.IntentProperty = {
      name: 'SignUp',
      sampleUtterances: [
        {
          utterance: '入会',
        },
      ],
      slots: [dateOfBirthSlot],
    };

    const fallbackIntent: lex.CfnBot.IntentProperty = {
      name: 'FallbackIntent',
      parentIntentSignature: 'AMAZON.FallbackIntent',
    };

    const bot = new lex.CfnBot(this, 'SignUpBot', {
      name: 'SignUpBot',
      idleSessionTtlInSeconds: 5 * 60,
      roleArn: lexRole.roleArn,
      dataPrivacy: {
        ChildDirected: true,
      },
      botLocales: [
        {
          localeId: 'ja_JP',
          nluConfidenceThreshold: 0.4,
          intents: [signUpIntent, fallbackIntent],
        },
      ],
    });

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
