import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { END, MessageGraph, START } from "@langchain/langgraph";
import { CompiledStateGraph } from "@langchain/langgraph/dist/graph/state";

class Cadburychat {
  private graph: MessageGraph;
  private model: ChatOpenAI;
  private runnable: CompiledStateGraph<any>;
  constructor(apiKey: string, model: string) {
    this.model = new ChatOpenAI({
      apiKey: apiKey,
      temperature: 0,
      model: model || "gpt-3.5-turbo",
    });
    this.graph = new MessageGraph();
    this.graph.addNode("askGPT", async (state) => {
      return this.model.invoke(state);
    });
    this.graph.addEdge("askGPT" as typeof START, END);
    this.graph.setEntryPoint("askGPT" as typeof START);
    this.runnable = this.graph.compile();
  }
  async askCadbury(message: string) {
    return await this.runnable.invoke(new HumanMessage(message));
  }
}
export default Cadburychat;
