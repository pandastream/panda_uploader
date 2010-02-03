SRC_DIR = src
BUILD_DIR = build
PREFIX = .
DIST_DIR = ${PREFIX}/dist

PU_CAT = ${DIST_DIR}/jquery.panda-uploader.cat.js
PU_MIN = ${DIST_DIR}/jquery.panda-uploader.min.js
GENERATED = ${PU_MIN} ${PU_CAT}

MINJAR = java -jar ${BUILD_DIR}/google-compiler-20100202.jar

MODULES = ${SRC_DIR}/swfupload.js\
	${SRC_DIR}/jquery.swfupload.js\
	${SRC_DIR}/jquery.panda-uploader.js


all: min
	@@echo "Panda uploader build complete."

min: ${PU_MIN}

${PU_MIN}: ${PU_CAT}
	@@${MINJAR} --js ${PU_CAT} --warning_level QUIET >> ${PU_MIN}
	@@rm -f ${PU_CAT}

${PU_CAT}: ${MODULES}
	@@echo "Building" ${PU_CAT}
	@@cat ${MODULES} > ${PU_CAT};

clean:
	@@echo "Removing Minimized js:" ${GENERATED}
	@@rm -f ${GENERATED}
