###############################
## Build env
###############################

FROM python:3.11-slim AS BUILD

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates pkg-config patch git gcc g++ make \
    bzip2 libssl-dev libffi-dev libpq-dev

RUN pip install --upgrade pip
COPY requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt


###############################
## Final image
###############################
FROM python:3.11-slim

LABEL maintainer "CRG System Developers"
LABEL org.label-schema.schema-version="2.0"
LABEL org.label-schema.vcs-url="ssh://git@devil.crg.eu:7999/qc/portal.git"

RUN groupadd ega && \
    useradd -M -g ega ega && \
    mkdir /var/run/ega && \
    chown -R ega:ega /var/run/ega && \
    mkdir /ega

COPY --from=BUILD /usr/local/lib/python3.11/ /usr/local/lib/python3.11/

EXPOSE 8080

WORKDIR /ega
ENTRYPOINT ["python", "-m", "code"]

COPY code       /ega/code

RUN chown -R ega:ega /ega
USER ega

ARG COMMIT
ARG BUILD_DATE
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-ref=$COMMIT
