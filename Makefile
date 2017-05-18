NM := node_modules/.bin
SRCS := $(shell find src -name '*.js')
DISTS := $(patsubst src/%,dist/%,$(SRCS))
DISTDIRS := $(sort $(dir $(DISTS)))
DEPS := $(DISTS) node_modules

# these are not files
.PHONY: dev build clean debug test

# disable default suffixes
.SUFFIXES:


build: $(DEPS)

dist/%.js: src/%.js node_modules | $(DISTDIRS)
	$(NM)/babel $< -o $@

$(DISTDIRS):
	mkdir -p $@

node_modules: yarn.lock
	yarn install --production=false
	touch node_modules

# fixme: how to not run this twice if yarn.lock is missing?
yarn.lock: package.json
	yarn install --production=false
	touch node_modules

clean:
	rm -rf dist node_modules

debug:
	$(info SRCS: $(SRCS))
	$(info DISTS: $(DISTS))
	$(info DISTDIRS: $(DISTDIRS))

