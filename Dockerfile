FROM denoland/deno:latest

USER root

WORKDIR /app

COPY deno.json ./

COPY . .

RUN deno cache main.ts

EXPOSE 3000

CMD ["deno", "task", "dev"]
