import OpenAI from 'openai';
const client = new OpenAI({ apiKey: 'test' });
client.chat.completions.create({
  model: 'test',
  messages: [{role: 'user', content: 'test'}],
  // @ts-expect-error - just checking if it works this way
  chat_template_kwargs: {}
});
