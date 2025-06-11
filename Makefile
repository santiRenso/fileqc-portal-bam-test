SHELL := /bin/bash
COMMIT ?= latest
TARGET := ega-qc-portal

.PHONY: build tag push

all: build

build:
	docker build $(ARGS) \
	       --build-arg COMMIT=$(COMMIT) \
               --build-arg BUILD_DATE="$(shell date +%Y-%m-%d_%H.%M.%S)" \
	       -t crg/$(TARGET):$(COMMIT) .

tag:
	docker tag crg/$(TARGET):$(COMMIT) crg/$(TARGET):latest
#	docker tag crg/$(TARGET):$(COMMIT) $(REGISTRY)/crg-$(TARGET):$(COMMIT)
#	docker rmi crg/$(TARGET):$(COMMIT)

push:
	docker push $(REGISTRY)/crg-$(TARGET):$(COMMIT)
	docker push $(REGISTRY)/crg-$(TARGET):latest


.PHONY: static
static-%:
	rm -rf /usr/share/ega/qc/static/$*
	cp -r static/$* /usr/share/ega/qc/static/$*

static: static-js static-img
sass:
	make -C static/scss GENDIR=/usr/share/ega/qc/static/css

#########################
## Booting (in test)
#########################
SERVICE=qc-portal

up debug: PORTS+=-p "127.0.0.1:8088:8080"

up debug: MOUNTPOINTS+=-v /QC/content:/QC-content
debug: MOUNTPOINTS+=-v $(shell pwd)/code:/ega/code
debug: MOUNTPOINTS+=-v $(shell pwd)/static:/ega/static

up: ENTRYPOINT=crg/$(TARGET):latest 8080
debug: ENTRYPOINT=--entrypoint /bin/sleep crg/$(TARGET):latest 365d

up debug:
	docker run --env-file .env -d \
	--hostname "ega-qc-portal" \
	--network ega-stats \
	--name "$(SERVICE)" \
	-e QC_ROOT="/QC-content" \
	$(PORTS) \
	$(MOUNTPOINTS) \
	$(LOGS) \
	$(ENTRYPOINT)

down:
	-docker stop $(SERVICE)
	-docker rm $(SERVICE)

logs:
	@docker logs -f $(SERVICE)

exec:
	@docker exec -it $(WITH_USER) $(SERVICE) bash

ps:
	@docker ps -a | grep $(SERVICE)

reboot: down wait up
