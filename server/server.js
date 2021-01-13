const { GraphQLServer, PubSub } = require("graphql-yoga");

const messages = [];

const typeDefs = `
type Message {
    id: ID!
    user: String!
    content: String!
}

type Query {
    messages: [Message!]
}

type Mutation {
    postMessage(user: String!, content: String!): ID!
}

type Subscription {
  messages: [Message!]
}
`;

const subscribers = []; //who is subscribed in the channel
const onMessagesUpdates = (fn) => subscribers.push(fn); // This allows us to add a new subscriber to list of subscribers

const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content }) => {
      const id = messages.length;
      messages.push({
        id,
        user,
        content,
      });
      subscribers.forEach((fn) => fn()); //Alert when new set of messages, iterate over subscribers then call the callback
      return id;
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages })); //use pubsub on channel to send messages
        setTimeout(() => pubsub.publish(channel, { messages }), 0); //setTimeout so auto sends first time
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}/`);
});
