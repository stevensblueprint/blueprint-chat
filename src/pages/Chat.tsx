import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Chat = () => {
  return (
    <>
      <div className="w-full">
        <div className="flex flex-row gap-2 items-center p-4">
          <img src="/src/assets/bp_logo.png" className="size-8" />
          <p className="text-3xl">Chat</p>
        </div>
        <div className="absolute w-1/2 left-1/2 transform -translate-x-1/2 flex flex-col gap-2">
          <div className="w-full h-full border-solid border-2 border-sky-200"></div>
          <div className="w-full border-solid border-2 border-sky-200 rounded-2xl flex flex-row gap-2 p-4">
            <Input placeholder="Ask Anything..." />
            <Button className="bg-blueprint-blue-primary">
              <Search />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
