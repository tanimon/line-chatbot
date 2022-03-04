export const handler = async (event: any) => {
  console.log(`event: ${JSON.stringify(event)}`);

  const requestBody = JSON.parse(event.body);
  console.log(`requestBody: ${JSON.stringify(requestBody)}`);

  const response = fulfillText(
    event,
    `Lambda function has received the following request:\n${JSON.stringify(
      requestBody
    )}`
  );
  const responseBody = JSON.parse(response.body);
  console.log(`responseBody: ${JSON.stringify(responseBody)}`);

  return response;
};

const fulfillText = (event: any, text: string): any => {
  const requestBody = JSON.parse(event.body);
  const responseBody = {
    fulfillmentMessages: [
      ...requestBody.queryResult.fulfillmentMessages,
      {
        text: {
          text: [text],
        },
      },
    ],
  };
  const resp = {
    statusCode: 200,
    body: JSON.stringify(responseBody),
    isBase64Encoded: false,
  };
  return resp;
};
