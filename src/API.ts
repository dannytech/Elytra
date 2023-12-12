import { Server as HTTPServer, IncomingMessage, ServerResponse } from "http";
import { Field, ObjectType, buildSchema } from "type-graphql";
import { YogaServerInstance, createYoga } from "graphql-yoga";
import { GraphQLSchema } from "graphql";

import { SettingsResolver } from "./ConfigurationResolver.js";

@ObjectType()
class BinaryData {
    @Field() encoding: "hex" | "base64";
    @Field() data: string;
}

class API {
    public static async Bootstrap(): Promise<HTTPServer> {
        // Compile GraphQL schema
        const schema: GraphQLSchema = await buildSchema({
            resolvers: [
                SettingsResolver
            ]
        });

        // Set up GraphQL handler
        const yoga: YogaServerInstance<IncomingMessage, ServerResponse> = createYoga({
            schema,
            multipart: true,
            graphiql: true,
            landingPage: false,
            logging: "debug"
        });

        // Create HTTP listener
        return new HTTPServer(yoga);
    }
}

export {
    BinaryData,
    API
};
