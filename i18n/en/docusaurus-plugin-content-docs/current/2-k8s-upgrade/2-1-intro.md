---
sidebar_position: 1
---

# Introduction

On the previous chapter, we set up simple K8S environments and deployed basic Argo Workflow app using official helm chart.  
However, currently we cannot login to our Argo app, and we're only able to access to service temporalily by port-forwarding process.

For more convenient workspace, let's advance K8S environment and configure our Argo workflow so that we can access and authorize to application.   
In this chapter, we'll try to:

- Set up Multi-node cluster (with 2 Worker nodes)
- Expose service with MetalLB & NGINX Ingress Controller
- Configure helm chart and deploy Argo Workflow to Master node
- Log in to Argo Workflow