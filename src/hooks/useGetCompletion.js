import useMessages from "../zustand/useMessages";

const useGetCompletion = () => {
    const { messages, setMessages } = useMessages();

    const getCompletion = async (message) => {

        try {
            setMessages([...messages,{id:messages.length, role:"user", message}]);
            const res = await fetch("/api/getNextResponse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, messages }),
            });

            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setMessages([...messages,{id:messages.length, role:"user", message}, {id:messages.length + 1, role:"assistant", message:data}]);


        } catch (error) {
            console.log(error.message);
        }
    }



    return { getCompletion }
}

export default useGetCompletion