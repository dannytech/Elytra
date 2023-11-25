import { IncomingMessage, ServerResponse } from "http";
import { buildSchema, ObjectType, Resolver, Query, Field } from "type-graphql";
import { YogaServerInstance, createYoga } from "graphql-yoga";

@ObjectType()
class DummyType {
    @Field() booleanValue: boolean;
}

@Resolver()
class EmptyResolver {
    @Query(() => DummyType)
    emptyQuery(): DummyType {
        return {
            booleanValue: true
        };
    }
}

// Helper type to describe HTTP server adapter
export type YogaServerAdapter = YogaServerInstance<typeof IncomingMessage, typeof ServerResponse>;

export class API {
    public static async Bootstrap(): Promise<YogaServerAdapter> {
        // Compile GraphQL schema
        const schema = await buildSchema({
            resolvers: [EmptyResolver]
        });

        // Set up GraphQL handler
        return createYoga({
            schema
        });
    }
}
