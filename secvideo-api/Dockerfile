FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["SecVideo.sln", "."]
COPY ["src/SecVideo.API/SecVideo.API.csproj", "src/SecVideo.API/"]
COPY ["src/SecVideo.Application/SecVideo.Application.csproj", "src/SecVideo.Application/"]
COPY ["src/SecVideo.Domain/SecVideo.Domain.csproj", "src/SecVideo.Domain/"]
COPY ["src/SecVideo.Infrastructure/SecVideo.Infrastructure.csproj", "src/SecVideo.Infrastructure/"]

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . .

# Build
WORKDIR "/src/src/SecVideo.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SecVideo.API.dll"]

