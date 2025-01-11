import { useState } from "react";
import useMessages from "../zustand/useMessages";

const useGetCompletion = () => {
    const { messages, setMessages } = useMessages();
    const [convId, setConvId] = useState(null);

    const getCompletion = async (message) => {

        try {
            setMessages([...messages,{id:messages.length, role:"user", message}]);
            const res = await fetch("/api/getNextResponse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, convId }),
            });

            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }

            if(!convId){
                setConvId(data.convId);
            }

            setMessages([...messages,{id:messages.length, role:"user", message}, {id:messages.length + 1, role:"assistant", message:data.completion}]);


        } catch (error) {
            console.log(error.message);
        }
    }



    return { getCompletion }
}

export default useGetCompletion