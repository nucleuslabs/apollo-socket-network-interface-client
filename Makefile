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

dist/%.js: src/%.js node_modules .babelrc | $(DISTDIRS)
	$(NM)/babel $< -o $@

$(DISTDIRS):
	mkdir -p $@

ifneq ("$(wildcard yarn.lock)","")
node_modules: yarn.lock
	@yarn install --production=false
	touch node_modules

yarn.lock: package.json
	touch yarn.lock
else # yarn.lock does not exist
node_modules: yarn.lock
	touch node_modules

yarn.lock: package.json
	@yarn install --production=false
endif

debug:
	$(info SRCS: $(SRCS))
	$(info DISTS: $(DISTS))
	$(info DISTDIRS: $(DISTDIRS))

publish:
	yarn version
	npm publish